const animeList = document.getElementById("animeList");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

function displayAnime(animeArray) {
    animeList.innerHTML = "";

    if (!animeArray || animeArray.length === 0) {
        animeList.innerHTML = `<p class="loading-text">Нічого не знайдено</p>`;
        return;
    }

    animeArray.slice(0, 8).forEach(anime => {
        const animeCard = document.createElement("div");
        animeCard.classList.add("movie-row");

        animeCard.innerHTML = `
            <img src="${anime.images?.jpg?.image_url || './images/moviecover.jfif'}" class="moviecover" alt="${anime.title}">
            <div class="movie-info">
                <h3>${anime.title}</h3>
                <p><strong>Рейтинг:</strong> ${anime.score ?? "Немає"}</p>
                <p><strong>Серій:</strong> ${anime.episodes ?? "Невідомо"}</p>
                <p><strong>Рік:</strong> ${anime.year ?? "Невідомо"}</p>
                <p>${anime.synopsis ? anime.synopsis.slice(0, 120) + "..." : "Опис відсутній"}</p>
            </div>
        `;

        animeList.appendChild(animeCard);
    });
}

async function getTopAnime() {
    try {
        animeList.innerHTML = `<p class="loading-text">Завантаження топ-аніме...</p>`;

        const response = await fetch("https://api.jikan.moe/v4/top/anime?type=tv");
        const result = await response.json();

        displayAnime(result.data);
    } catch (error) {
        animeList.innerHTML = `<p class="loading-text">Помилка завантаження 😢</p>`;
        console.error("Помилка API:", error);
    }
}

async function searchAnime() {
    const query = searchInput.value.trim();

    if (!query) {
        getTopAnime();
        return;
    }

    try {
        animeList.innerHTML = `<p class="loading-text">Пошук...</p>`;

        const response = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}`);
        const result = await response.json();

        displayAnime(result.data);
    } catch (error) {
        animeList.innerHTML = `<p class="loading-text">Помилка пошуку 😢</p>`;
        console.error("Помилка API:", error);
    }
}

searchBtn.addEventListener("click", searchAnime);

searchInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        searchAnime();
    }
});

getTopAnime();