const animeList = document.getElementById("animeList");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const filterToggle = document.getElementById("filterToggle");
const filterPanel = document.getElementById("filterPanel");
const genreFilter = document.getElementById("genreFilter");
const minScoreFilter = document.getElementById("minScoreFilter");
const typeFilter = document.getElementById("typeFilter");
const statusFilter = document.getElementById("statusFilter");
const sortByFilter = document.getElementById("sortByFilter");
const sortDirectionFilter = document.getElementById("sortDirectionFilter");
const applyFiltersBtn = document.getElementById("applyFiltersBtn");
const resetFiltersBtn = document.getElementById("resetFiltersBtn");

const defaultFilters = {
    genre: "",
    minScore: "",
    type: "",
    status: "",
    sortBy: "score",
    sortDirection: "desc"
};

function setLoadingState(message) {
    animeList.innerHTML = `<p class="loading-text">${message}</p>`;
}

function setFilterPanelState(isOpen) {
    filterPanel.classList.toggle("is-open", isOpen);
    filterToggle.classList.toggle("is-active", isOpen);
    filterToggle.setAttribute("aria-expanded", String(isOpen));
    filterPanel.setAttribute("aria-hidden", String(!isOpen));
}

function getSelectedFilters() {
    return {
        genre: genreFilter.value,
        minScore: minScoreFilter.value,
        type: typeFilter.value,
        status: statusFilter.value,
        sortBy: sortByFilter.value || defaultFilters.sortBy,
        sortDirection: sortDirectionFilter.value || defaultFilters.sortDirection
    };
}

function resetFilters() {
    genreFilter.value = defaultFilters.genre;
    minScoreFilter.value = defaultFilters.minScore;
    typeFilter.value = defaultFilters.type;
    statusFilter.value = defaultFilters.status;
    sortByFilter.value = defaultFilters.sortBy;
    sortDirectionFilter.value = defaultFilters.sortDirection;
}

function populateGenres(genres) {
    const previousValue = genreFilter.value;
    genreFilter.innerHTML = '<option value="">Усі жанри</option>';

    genres.forEach((genre) => {
        const option = document.createElement("option");
        option.value = String(genre.mal_id);
        option.textContent = genre.name;
        genreFilter.appendChild(option);
    });

    genreFilter.value = previousValue || defaultFilters.genre;
}

function buildGenreText(anime) {
    if (!anime.genres || anime.genres.length === 0) {
        return "Невідомо";
    }

    return anime.genres
        .slice(0, 3)
        .map((genre) => genre.name)
        .join(", ");
}

function buildSynopsisText(anime) {
    if (!anime.synopsis) {
        return "Опис відсутній";
    }

    if (anime.synopsis.length <= 140) {
        return anime.synopsis;
    }

    return `${anime.synopsis.slice(0, 140)}...`;
}

function applyLocalFilters(animeArray, filters) {
    let filteredAnime = Array.isArray(animeArray) ? [...animeArray] : [];

    if (filters.minScore) {
        const minScoreValue = Number(filters.minScore);

        filteredAnime = filteredAnime.filter((anime) => {
            const animeScore = Number(anime.score);
            return Number.isFinite(animeScore) && animeScore >= minScoreValue;
        });
    }

    return filteredAnime;
}

function displayAnime(animeArray) {
    animeList.innerHTML = "";

    if (!animeArray || animeArray.length === 0) {
        setLoadingState("Нічого не знайдено");
        return;
    }

    animeArray.slice(0, 12).forEach((anime) => {
        const animeCard = document.createElement("div");
        animeCard.classList.add("movie-row");

        const score = typeof anime.score === "number" ? anime.score.toFixed(1) : "Немає";
        const episodes = anime.episodes ?? "Невідомо";
        const year = anime.year ?? "Невідомо";
        const genres = buildGenreText(anime);
        const synopsis = buildSynopsisText(anime);

        animeCard.innerHTML = `
            <img src="${anime.images?.jpg?.image_url || "./images/moviecover.jfif"}" class="moviecover" alt="${anime.title}">
            <div class="movie-info">
                <h3>${anime.title}</h3>
                <p><strong>Рейтинг:</strong> ${score}</p>
                <p><strong>Жанри:</strong> ${genres}</p>
                <p><strong>Серій:</strong> ${episodes}</p>
                <p><strong>Рік:</strong> ${year}</p>
                <p>${synopsis}</p>
            </div>
        `;

        animeList.appendChild(animeCard);
    });
}

async function loadGenres() {
    try {
        const response = await fetch("https://api.jikan.moe/v4/genres/anime");

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        populateGenres(result.data || []);
    } catch (error) {
        console.error("Помилка завантаження жанрів:", error);
    }
}

async function loadAnime() {
    const query = searchInput.value.trim();
    const filters = getSelectedFilters();
    const params = new URLSearchParams({
        limit: "25",
        sfw: "true",
        page: "1",
        order_by: filters.sortBy,
        sort: filters.sortDirection
    });

    if (query) {
        params.set("q", query);
    }

    if (filters.genre) {
        params.set("genres", filters.genre);
    }

    if (filters.minScore) {
        params.set("min_score", filters.minScore);
    }

    if (filters.type) {
        params.set("type", filters.type);
    }

    if (filters.status) {
        params.set("status", filters.status);
    }

    try {
        setLoadingState(query ? "Шукаємо аніме..." : "Завантажуємо аніме...");

        const response = await fetch(`https://api.jikan.moe/v4/anime?${params.toString()}`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        const filteredResults = applyLocalFilters(result.data || [], filters);
        displayAnime(filteredResults);
    } catch (error) {
        setLoadingState("Помилка завантаження 😢");
        console.error("Помилка API:", error);
    }
}

filterToggle.addEventListener("click", () => {
    const isOpen = !filterPanel.classList.contains("is-open");
    setFilterPanelState(isOpen);
});

applyFiltersBtn.addEventListener("click", async () => {
    setFilterPanelState(false);
    await loadAnime();
});

resetFiltersBtn.addEventListener("click", async () => {
    resetFilters();
    setFilterPanelState(false);
    await loadAnime();
});

searchBtn.addEventListener("click", loadAnime);

searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        loadAnime();
    }
});

document.addEventListener("click", (event) => {
    const clickedInsidePanel = filterPanel.contains(event.target);
    const clickedToggle = filterToggle.contains(event.target);

    if (!clickedInsidePanel && !clickedToggle) {
        setFilterPanelState(false);
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        setFilterPanelState(false);
    }
});

resetFilters();
loadGenres();
loadAnime();
