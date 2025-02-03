const API_GEOLOCATION_URL = "https://geocoding-api.open-meteo.com/v1/search";
const API_FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

const cityForm = document.querySelector("#cityForm");
const locationBtn = document.querySelector("#locationBtn");
const weatherContainer = document.querySelector("#weatherContainer");
const favoritesContainer = document.querySelector("#favoritesContainer");

document.addEventListener("DOMContentLoaded", () => {
  displayFavorites();
  updateBackground();
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark-mode");
  }
});

cityForm.addEventListener("submit", onCityFormSubmit);
locationBtn.addEventListener("click", onLocationBtnClick);

let weatherChartInstance = null;

async function onCityFormSubmit(event) {
  event.preventDefault();
  const cityName = document.querySelector("#city").value.trim();

  if (!cityName) {
    displayError("Introduceți un oraș!");
    return;
  }

  getWeatherForCity(cityName);
  document.querySelector("#city").value = "";
}

async function onLocationBtnClick() {
  if (!navigator.geolocation) {
    displayError("Geolocalizarea nu este suportată de browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) =>
      getWeatherForCoords(
        position.coords.latitude,
        position.coords.longitude,
        "Locația mea"
      ),
    () => displayError("Nu am putut accesa locația.")
  );
}

async function getWeatherForCity(cityName) {
  try {
    const response = await axios.get(API_GEOLOCATION_URL, {
      params: { name: cityName, count: 1 },
    });

    if (!response.data.results)
      throw new Error(`Orașul ${cityName} nu a fost găsit!`);

    const { latitude, longitude } = response.data.results[0];
    getWeatherForCoords(latitude, longitude, cityName);
  } catch (error) {
    displayError(error.message);
  }
}
async function getWeatherForCoords(lat, long, cityName = "Locația ta") {
  const params = {
    latitude: lat,
    longitude: long,
    timezone: "auto",
    current_weather: true,
    daily:
      "temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weathercode",
    forecast_days: 7, // ✅ Asigură returnarea prognozei pe 7 zile
  };

  try {
    const response = await axios.get(API_FORECAST_URL, { params });

    console.log("📌 API Response:", JSON.stringify(response.data, null, 2));

    if (
      !response.data ||
      !response.data.daily ||
      !response.data.current_weather
    ) {
      throw new Error("Datele meteo nu sunt disponibile.");
    }

    if (response.data.daily.time.length < 7) {
      throw new Error("Prognoza meteo este incompletă!");
    }

    const weatherData = response.data.daily.time.map((date, i) => ({
      date: date,
      tempMax: response.data.daily.temperature_2m_max[i],
      tempMin: response.data.daily.temperature_2m_min[i],
      precipitation: response.data.daily.precipitation_sum[i],
      windSpeed: response.data.daily.wind_speed_10m_max[i],
      weatherCode: response.data.daily.weathercode
        ? response.data.daily.weathercode[i]
        : 0,
    }));

    const currentWeather = {
      temperature: response.data.current_weather.temperature,
      windSpeed: response.data.current_weather.windspeed,
      weatherCode: response.data.current_weather.weathercode || 0,
    };

    displayWeather(cityName, weatherData, currentWeather);
  } catch (error) {
    console.error("❌ API Error:", error.message);
    displayError(error.message);
  }
}


function displayWeather(cityName, weatherData, currentWeather) {
  checkWeatherAlerts(currentWeather); // ✅ Verifică alertele meteo

  weatherContainer.innerHTML = `
    <h2 class="text-center">${cityName}</h2>
    
    <div class="current-weather card text-white bg-primary p-3 mb-3">
      <h3>Vremea acum</h3>
      <p class="icon"><i class="wi ${getWeatherIconCSS(currentWeather.weatherCode)} wi-fw"></i></p>
      <p>🌡️ Temperatură: <strong>${currentWeather.temperature}°C</strong></p>
      <p>💨 Vânt: <strong>${currentWeather.windSpeed} km/h</strong></p>
    </div>

    <h3 class="text-center mt-3">Prognoza pe următoarele zile</h3>
    <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3" id="forecastCards"></div>

    <canvas id="weatherChart"></canvas>
  `;

  const forecastContainer = document.getElementById("forecastCards");
  forecastContainer.innerHTML = ""; // ✅ Curăță conținutul anterior

  weatherData.forEach((day) => {
    forecastContainer.innerHTML += `
      <div class="col">
        <div class="weather-card card p-3">
          <p class="date fw-bold">${new Date(day.date).toLocaleDateString("ro-RO", { weekday: "long", day: "2-digit", month: "short" })}</p>
          <p class="icon"><i class="wi ${getWeatherIconCSS(day.weatherCode)} wi-fw"></i></p>
          <p>🌡️ Max: <strong>${day.tempMax}°C</strong></p>
          <p>❄️ Min: <strong>${day.tempMin}°C</strong></p>
          <p>💨 Vânt: <strong>${day.windSpeed} km/h</strong></p>
          <p>☔ Precipitații: <strong>${day.precipitation} mm</strong></p>
        </div>
      </div>`;
  });

  console.log("📅 Forecast HTML:", forecastContainer.innerHTML);

  // ✅ Asigură-te că prognoza este vizibilă
  setTimeout(() => {
    document.querySelectorAll(".weather-card").forEach((card) => {
      card.classList.add("show");
    });
  }, 100);

  // ✅ Afișează graficul meteo
  displayWeatherChart(weatherData);
}


function checkWeatherAlerts(currentWeather) {
  if (currentWeather.temperature > 35) {
    displayError("⚠️ ATENȚIE: Temperatură extrem de ridicată!");
  } else if (currentWeather.windSpeed > 80) {
    displayError("🌪️ ALERTĂ: Rafale de vânt puternice!");
  }
}


function displayWeatherChart(weatherData) {
  const ctx = document.getElementById("weatherChart")?.getContext("2d");

  if (!ctx) {
    console.warn("Elementul canvas pentru grafic nu există.");
    return;
  }

  if (weatherChartInstance) {
    weatherChartInstance.destroy();
  }

  weatherChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: weatherData.map((day) =>
        new Date(day.date).toLocaleDateString("ro-RO")
      ),
      datasets: [
        {
          label: "Temperatură Max (°C)",
          data: weatherData.map((day) => day.tempMax),
          borderColor: "red",
          fill: false,
        },
        {
          label: "Temperatură Min (°C)",
          data: weatherData.map((day) => day.tempMin),
          borderColor: "blue",
          fill: false,
        },
      ],
    },
  });
}

function displayFavorites() {
  favoritesContainer.innerHTML = "<h3>Orașe favorite</h3>";
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

  if (favorites.length === 0) {
    favoritesContainer.innerHTML +=
      "<p class='text-muted'>Nu aveți orașe favorite.</p>";
    return;
  }

  favorites.forEach((city, index) => {
    favoritesContainer.innerHTML += `
      <div class="d-flex justify-content-between border p-2 mt-2">
        <button class="btn btn-outline-primary" onclick="getWeatherForCity('${city}')">${city}</button>
        <button class="btn btn-danger btn-sm" onclick="removeFavorite(${index})">🗑️</button>
      </div>
    `;
  });
}

function addFavorite(cityName) {
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

  if (!favorites.includes(cityName)) {
    favorites.push(cityName);
    localStorage.setItem("favorites", JSON.stringify(favorites));
    displayFavorites();
  } else {
    alert("Orașul este deja în lista de favorite!");
  }
}

function removeFavorite(index) {
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  favorites.splice(index, 1);
  localStorage.setItem("favorites", JSON.stringify(favorites));
  displayFavorites();
}


function displayError(message) {
  weatherContainer.innerHTML = `
    <div class="alert alert-danger text-center p-3">
      ❌ ${message}
    </div>
  `;
}

function getWeatherIconCSS(code) {
  if (code === 0) return "wi-day-sunny";
  if (code === 1 || code === 2) return "wi-day-cloudy";
  if (code === 3) return "wi-cloudy";
  if (code >= 45 && code <= 48) return "wi-fog";
  if (code >= 51 && code <= 65) return "wi-rain";
  if (code >= 71 && code <= 75) return "wi-snow";
  if (code === 95 || code === 96 || code === 99) return "wi-thunderstorm";
  return "wi-na";
}

function updateBackground() {
  const hour = new Date().getHours();
  document.body.style.background =
    hour >= 6 && hour < 18
      ? "linear-gradient(to bottom, #43cea2, #185a9d)"
      : "linear-gradient(to bottom, #141e30, #243b55)";
}


function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");

  // ✅ Salvăm preferința în localStorage
  localStorage.setItem(
    "darkMode",
    document.body.classList.contains("dark-mode")
  );
}

// ✅ Aplicăm Dark Mode la încărcarea paginii
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark-mode");
  }
});
