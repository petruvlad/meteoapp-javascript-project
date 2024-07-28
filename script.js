const WEATHER_API_KEY = "315cde5bcd140cfa83abe23a8539ef75";
const BASE_WEATHER_URL = "https://api.openweathermap.org/data/2.5/forecast";

const PIXABAY_API_KEY = "44859796-8d16fe632c2b20be0c65ff839";
const PIXABAY_API_URL = "https://pixabay.com/api/";

let isCelsius = true;

document
  .getElementById("weatherForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    const city = document.getElementById("cityInput").value;
    getWeatherData(city);
  });

document.getElementById("toggleUnit").addEventListener("click", function () {
  isCelsius = !isCelsius;
  const city = document.getElementById("cityInput").value;
  if (city) {
    getWeatherData(city);
  }
});

document.getElementById("useLocation").addEventListener("click", function () {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      getWeatherDataByCoords(lat, lon);
    });
  } else {
    alert("Geolocation is not supported by this browser.");
  }
});

document.getElementById("toggle5Day").addEventListener("click", function () {
  const fiveDayForecast = document.getElementById("fiveDayForecast");
  if (fiveDayForecast.classList.contains("hidden")) {
    fiveDayForecast.classList.remove("hidden");
    this.textContent = "Hide 5-Day Forecast";
  } else {
    fiveDayForecast.classList.add("hidden");
    this.textContent = "Show 5-Day Forecast";
  }
});

document.getElementById("toggleTheme").addEventListener("click", function () {
  document.body.classList.toggle("dark");
});

async function getWeatherData(city) {
  try {
    const units = isCelsius ? "metric" : "imperial";
    const response = await fetch(
      `${BASE_WEATHER_URL}?q=${city}&appid=${WEATHER_API_KEY}&units=${units}`
    );
    const data = await response.json();
    displayTodayWeather(data);
    display5DayWeather(data);
    fetchCityImages(data.city.name); // Fetch city-specific images
  } catch (error) {
    console.error("Error fetching weather data:", error);
  }
}

async function getWeatherDataByCoords(lat, lon) {
  try {
    const units = isCelsius ? "metric" : "imperial";
    const response = await fetch(
      `${BASE_WEATHER_URL}?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=${units}`
    );
    const data = await response.json();
    displayTodayWeather(data);
    display5DayWeather(data);
    fetchCityImages(data.city.name); // Fetch city-specific images
  } catch (error) {
    console.error("Error fetching weather data:", error);
  }
}

function groupForecastsByDay(data) {
  const dailyForecasts = {};
  data.list.forEach((forecast) => {
    const date = new Date(forecast.dt * 1000);
    const day = date.toLocaleDateString();
    if (!dailyForecasts[day]) {
      dailyForecasts[day] = [];
    }
    dailyForecasts[day].push(forecast);
  });
  return dailyForecasts;
}

function displayTodayWeather(data) {
  const weatherOutput = document.getElementById("weatherOutput");
  weatherOutput.innerHTML = "";

  if (data.cod !== "200") {
    weatherOutput.innerHTML = `<p>Error: ${data.message}</p>`;
    return;
  }

  const today = new Date().toLocaleDateString();
  const dailyForecasts = groupForecastsByDay(data);

  if (dailyForecasts[today]) {
    const todayHeader = document.createElement("h2");
    todayHeader.textContent = `Today's Weather for ${data.city.name}`;
    weatherOutput.appendChild(todayHeader);

    dailyForecasts[today].forEach((forecast) => {
      const hourDiv = document.createElement("div");
      hourDiv.classList.add("hour-forecast", "forecast");

      const date = new Date(forecast.dt * 1000);
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");

      const dateTime = `${hours}:${minutes}`;
      const temp = forecast.main.temp;
      const description = forecast.weather[0].description;
      const iconCode = forecast.weather[0].icon;
      const iconUrl = `http://openweathermap.org/img/wn/${iconCode}@2x.png`;

      hourDiv.innerHTML = `
        <h3>${dateTime}</h3>
        <img src="${iconUrl}" alt="${description}" title="${description}">
        <p>Temperature: ${temp.toFixed(1)}${isCelsius ? "°C" : "°F"}</p>
        <p>${description}</p>
      `;

      weatherOutput.appendChild(hourDiv);
    });

    // Add loaded class to trigger CSS transitions
    setTimeout(() => weatherOutput.classList.add("loaded"), 100);

    // Show the 5-day forecast button
    document.getElementById("toggle5Day").classList.remove("hidden");
  }
}

function display5DayWeather(data) {
  const fiveDayForecast = document.getElementById("fiveDayForecast");
  fiveDayForecast.innerHTML = "";

  if (data.cod !== "200") {
    fiveDayForecast.innerHTML = `<p>Error: ${data.message}</p>`;
    return;
  }

  const dailyForecasts = groupForecastsByDay(data);
  const days = Object.keys(dailyForecasts);

  days.slice(1, 6).forEach((day) => {
    const dayDiv = document.createElement("div");
    dayDiv.classList.add("day-forecast", "forecast");

    const dayForecasts = dailyForecasts[day];
    const avgTemp =
      dayForecasts.reduce((sum, f) => sum + f.main.temp, 0) /
      dayForecasts.length;
    const description = dayForecasts[0].weather[0].description;
    const iconCode = dayForecasts[0].weather[0].icon;
    const iconUrl = `http://openweathermap.org/img/wn/${iconCode}@2x.png`;

    dayDiv.innerHTML = `
      <h3>${day}</h3>
      <img src="${iconUrl}" alt="${description}" title="${description}">
      <p>Average Temperature: ${avgTemp.toFixed(1)}${
      isCelsius ? "°C" : "°F"
    }</p>
      <p>${description}</p>
    `;

    fiveDayForecast.appendChild(dayDiv);
  });

  // Add loaded class to trigger CSS transitions
  setTimeout(() => fiveDayForecast.classList.add("loaded"), 100);

  // Fetch and display images from Pixabay for each day's weather
  days.forEach((day) => {
    const dayForecasts = dailyForecasts[day];
    const description = dayForecasts[0].weather[0].description;
    fetchWeatherImages(description);
  });

  // Show the 5-day forecast button
  document.getElementById("toggle5Day").classList.remove("hidden");
}

async function fetchWeatherImages(query, container = document.body) {
  try {
    const response = await fetch(
      `${PIXABAY_API_URL}?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(
        query
      )}&image_type=photo&category=backgrounds&per_page=3`
    );
    const data = await response.json();

    if (data.hits && data.hits.length > 0) {
      const imageUrl = data.hits[0].webformatURL;
      container.style.backgroundImage = `url(${imageUrl})`;
      container.style.backgroundSize = "cover";
      container.style.backgroundPosition = "center";
      container.style.borderRadius = "10px";
    }
  } catch (error) {
    console.error("Error fetching images from Pixabay:", error);
  }
}

async function fetchCityImages(city) {
  try {
    const response = await fetch(
      `${PIXABAY_API_URL}?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(
        city
      )}&image_type=photo&category=places&per_page=3`
    );
    const data = await response.json();

    if (data.hits && data.hits.length > 0) {
      const imageUrl = data.hits[0].webformatURL;
      document.body.style.backgroundImage = `url(${imageUrl})`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
    }
  } catch (error) {
    console.error("Error fetching city images from Pixabay:", error);
  }
}
