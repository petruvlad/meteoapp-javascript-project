document.addEventListener("DOMContentLoaded", function () {
  const apiKey = "315cde5bcd140cfa83abe23a8539ef75"; // Cheia API OpenWeatherMap
  const pixabayApiKey = "44859796-8d16fe632c2b20be0c65ff839"; // Cheia API Pixabay
  const pixabayApiUrl = "https://pixabay.com/api/";

  const searchButton = document.getElementById("search-button");
  const searchBar = document.getElementById("search-bar");
  const currentWeatherSection = document.getElementById("current-weather");
  const weatherAnimationSection = document.getElementById("weather-animation");
  const forecastSection = document.getElementById("five-day-forecast");
  const hourlyForecastSection = document.getElementById("hourly-forecast");
  const todayButton = document.getElementById("today-button");
  const fiveDaysButton = document.getElementById("five-days-button");

  let hourlyChart;
  let fiveDayChart;

  // Funcția pentru afișarea datei curente
  function displayCurrentDate() {
    const dateSection = document.getElementById("date");
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    const today = new Date().toLocaleDateString("en-US", options);

    dateSection.innerHTML = `<p>Today's Date: ${today}</p>`;
  }

  // Apelarea funcției pentru afișarea datei curente la încărcarea paginii
  displayCurrentDate();

  searchButton.addEventListener("click", function () {
    const city = searchBar.value.trim();
    if (city.length > 0 && city.length <= 50) {
      fetchCoordinates(city);
    } else {
      console.error("Invalid city name input.");
      // Afișăm un mesaj utilizatorului despre input invalid
    }
  });

  todayButton.addEventListener("click", function () {
    currentWeatherSection.style.display = "block";
    weatherAnimationSection.style.display = "block";
    hourlyForecastSection.style.display = "block";
    forecastSection.style.display = "none";
  });

  fiveDaysButton.addEventListener("click", function () {
    currentWeatherSection.style.display = "none";
    weatherAnimationSection.style.display = "none";
    hourlyForecastSection.style.display = "none";
    forecastSection.style.display = "block";
  });

  function fetchCoordinates(city) {
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`;

    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        if (data.length > 0) {
          const { lat, lon } = data[0];
          fetchCurrentWeather(lat, lon);
          fetchWeatherAnimation(lat, lon);
          fetchFiveDayForecast(lat, lon);
          fetchHourlyForecast(lat, lon);
          reverseGeocode(lat, lon);
          fetchBackgroundImage(city); // Adăugăm și funcția pentru imaginea de fundal
          displayRandomQuote(); // Afișăm un citat motivațional nou
        } else {
          console.error("No results found for the specified city.");
          // Afișăm un mesaj către utilizator că nu s-au găsit rezultate pentru orașul specificat
        }
      })
      .catch((error) => {
        console.error("Error fetching coordinates:", error);
        // Afișăm un mesaj de eroare general utilizatorului
      });
  }

  function fetchCurrentWeather(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        displayCurrentWeather(data);
      })
      .catch((error) => {
        console.error("Error fetching current weather:", error);
        // Afișăm un mesaj de eroare general utilizatorului
      });
  }

  function displayCurrentWeather(data) {
    currentWeatherSection.innerHTML = `
            <h2>Current Weather in ${data.name}</h2>
            <p>Temperature: ${data.main.temp}°C</p>
            <p>Description: ${data.weather[0].description}</p>
        `;
  }

  function fetchWeatherAnimation(lat, lon) {
    const animationUrl = `https://openweathermap.org/weathermap?basemap=map&cities=false&layer=clouds&lat=${lat}&lon=${lon}&zoom=10`;

    if (weatherAnimationSection) {
      weatherAnimationSection.innerHTML = `
                <iframe class="weather-animation-frame" src="${animationUrl}" frameborder="0"></iframe>
            `;
    } else {
      console.error("weatherAnimationSection is null.");
    }
  }

  function fetchFiveDayForecast(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        displayFiveDayForecast(data);
      })
      .catch((error) => {
        console.error("Error fetching five day forecast:", error);
        // Afișăm un mesaj de eroare general utilizatorului
      });
  }

  function displayFiveDayForecast(data) {
    const labels = [];
    const temperatures = [];
    const backgroundColors = [];

    data.list.forEach((item) => {
      const date = new Date(item.dt * 1000);
      labels.push(
        `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`
      );
      temperatures.push(item.main.temp);
      backgroundColors.push(getBackgroundColor(date.getHours()));
    });

    if (fiveDayChart) {
      fiveDayChart.destroy();
    }

    const ctx = document
      .getElementById("five-day-forecast-chart")
      .getContext("2d");
    fiveDayChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Temperature (°C)",
            data: temperatures,
            backgroundColor: backgroundColors,
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
            fill: false,
          },
        ],
      },
      options: {
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: "Date",
            },
          },
          y: {
            display: true,
            title: {
              display: true,
              text: "Temperature (°C)",
            },
          },
        },
      },
    });
  }

  function fetchHourlyForecast(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        displayHourlyForecast(data);
      })
      .catch((error) => {
        console.error("Error fetching hourly forecast:", error);
        // Afișăm un mesaj de eroare general utilizatorului
      });
  }

  function displayHourlyForecast(data) {
    const labels = [];
    const temperatures = [];
    const backgroundColors = [];

    data.list.slice(0, 8).forEach((item) => {
      const date = new Date(item.dt * 1000);
      labels.push(`${date.getHours()}:00`);
      temperatures.push(item.main.temp);
      backgroundColors.push(getBackgroundColor(date.getHours()));
    });

    if (hourlyChart) {
      hourlyChart.destroy();
    }

    const ctx = document
      .getElementById("hourly-forecast-chart")
      .getContext("2d");
    hourlyChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Temperature (°C)",
            data: temperatures,
            backgroundColor: backgroundColors,
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 2,
            fill: false,
          },
        ],
      },
      options: {
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: "Hour",
            },
          },
          y: {
            display: true,
            title: {
              display: true,
              text: "Temperature (°C)",
            },
          },
        },
      },
    });
  }

  function getBackgroundColor(hour) {
    if (hour >= 6 && hour < 12) {
      return "rgba(255, 215, 0, 0.2)"; // Morning: gold
    } else if (hour >= 12 && hour < 18) {
      return "rgba(135, 206, 235, 0.2)"; // Afternoon: skyblue
    } else if (hour >= 18 && hour < 21) {
      return "rgba(255, 140, 0, 0.2)"; // Evening: darkorange
    } else {
      return "rgba(47, 79, 79, 0.2)"; // Night: darkslategray
    }
  }

  function reverseGeocode(lat, lon) {
    const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`;

    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        if (data.length > 0) {
          const cityName = data[0].name;
          console.log(`Reverse geocoded city name: ${cityName}`);
          // Afișăm numele orașului găsit pe bază de coordonate
        } else {
          console.error("No results found for the specified coordinates.");
          // Afișăm un mesaj către utilizator că nu s-au găsit rezultate pentru coordonatele specificate
        }
      })
      .catch((error) => {
        console.error("Error fetching reverse geocoding data:", error);
        // Afișăm un mesaj de eroare general utilizatorului
      });
  }

  function fetchBackgroundImage(city) {
    const apiUrl = `${pixabayApiUrl}?key=${pixabayApiKey}&q=${city}&image_type=photo`;

    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        const backgroundImageUrl = data.hits[0].largeImageURL;
        applyBackgroundImage(backgroundImageUrl);
      })
      .catch((error) => {
        console.error("Error fetching background image:", error);
      });
  }

  function applyBackgroundImage(url) {
    document.body.style.backgroundImage = `url(${url})`;
  }

  const motivationalQuotes = [
    "Success is not final, failure is not fatal: It is the courage to continue that counts. - Winston Churchill",
    "Hardships often prepare ordinary people for an extraordinary destiny. - C.S. Lewis",
    "Believe you can and you're halfway there. - Theodore Roosevelt",
    "It does not matter how slowly you go as long as you do not stop. - Confucius",
    "You are never too old to set another goal or to dream a new dream. - C.S. Lewis",
    "The only way to achieve the impossible is to believe it is possible. - Charles Kingsleigh",
  ];

  function displayRandomQuote() {
    const quoteSection = document.getElementById("quote");
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
    const randomQuote = motivationalQuotes[randomIndex];

    quoteSection.innerHTML = `<blockquote>${randomQuote}</blockquote>`;
  }

  // Apelarea funcției pentru afișarea unui citat motivațional la încărcarea paginii
  displayRandomQuote();
});
