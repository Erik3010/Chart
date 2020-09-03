const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const w = canvas.width;
const h = canvas.height;

const MARGIN = {
  TOP: 50,
  BOTTOM: 30,
  LEFT: 50,
  RIGHT: 50,
};

const TYPE = {
  WORLD: "world",
  COUNTRY: "country",
};

let cell = [];

const actualWidth = w - (MARGIN.LEFT + MARGIN.RIGHT);
const actualHeight = h - (MARGIN.TOP + MARGIN.BOTTOM);

const select = document.getElementById("country");

window.onload = function () {
  getFile();
};

/**
 * Get the CSV file
 */
function getFile() {
  fetch("death-rate-by-source-from-air-pollution.csv")
    .then((res) => res.text())
    .then((res) => processData(res))
    .catch((err) => {
      console.log(err);
    });
}

/**
 * Get csv data collumn with escape the doule quotation
 * Source: https://stackoverflow.com/questions/11456850/split-a-string-by-commas-but-ignore-commas-within-double-quotes-using-javascript
 */
function getCell(row) {
  let delimiter = ",";
  let quotes = '"';

  let splitCell = row.split(delimiter);
  let cell = [];

  for (let i = 0; i < splitCell.length; i++) {
    if (splitCell[i].indexOf(quotes) >= 0) {
      let indexOfRightQuotes = -1;
      let temp = splitCell[i];

      for (let j = i + 1; j < splitCell.length; j++) {
        if (splitCell[j].indexOf(quotes) >= 0) {
          indexOfRightQuotes = j;
          break;
        }
      }

      if (indexOfRightQuotes != -1) {
        for (let j = i + 1; j <= indexOfRightQuotes; j++) {
          temp = temp + delimiter + splitCell[j];
        }
        temp = temp.split('"')[1];
        cell.push(temp);
        i = indexOfRightQuotes;
      } else {
        cell.push(splitCell[i]);
      }
    } else {
      cell.push(splitCell[i]);
    }
  }

  return cell;
}

/**
 * Process the data
 * @param {Array} result Array contain per row from CSV file
 */
function processData(result) {
  // let rows = result.split('/\r?\n|\r/');
  let rows = result.split("\n");

  rows.forEach((row, index) => {
    if (index === 0) return;
    cell.push(getCell(row));
  });

  let countryData = cell.reduce((country, value) => {
    let [name, code, year, ozone, pollution, particulate] = value;

    country[year] = country[year] || [];

    country[year].push({
      name,
      code,
      year: +year,
      ozone: +ozone,
      pollution: +pollution,
      particulate: +particulate,
      totalPollution: +pollution + +particulate,
      total: +ozone + +particulate + +pollution,
    });

    return country;
  }, []);
  draw(countryData);

  renderOption(cell);
}

function draw(countryData) {
  let years = Object.keys(countryData);
  let totalAll = countTotal(years, countryData, "total");
  let totalPollution = countTotal(years, countryData, "totalPollution");
  let particulate = countTotal(years, countryData, "particulate");

  let largest = Math.max(...totalAll);

  drawGridAndLabels(totalAll, years);

  drawChart(totalAll, "rgba(234, 150, 26, 0.8)", "rgb(234, 150, 26)", 2);
  drawChart(
    totalPollution,
    "rgba(245, 50, 50)",
    "rgb(245, 50, 50)",
    2,
    largest
  );
  drawChart(particulate, "rgb(91, 91, 220)", "rgb(91, 91, 220)", 2, largest);

  // TODO: Draw vertical line
  drawLine(MARGIN.LEFT, MARGIN.TOP, MARGIN.LEFT, actualHeight, "black", 2);
  // TODO: Draw horizontal line
  drawLine(
    MARGIN.LEFT,
    actualHeight,
    actualWidth + MARGIN.LEFT / 2,
    actualHeight,
    "black",
    2
  );
}

function drawPerCountry(country) {
  let items = country.map((c) => c.total);
  let years = country.map((c) => +c.year);

  drawGridAndLabels(items, years);

  let largest = Math.max(...items);

  drawChart(items, "rgba(234, 150, 26, 0.8)", "rgb(234, 150, 26)", 2);
  drawChart(
    country.map((country) => country.totalPollution),
    "rgba(245, 50, 50)",
    "rgb(245, 50, 50)",
    2,
    largest
  );
  drawChart(
    country.map((country) => country.particulate),
    "rgb(91, 91, 220)",
    "rgb(91, 91, 220)",
    2,
    largest
  );
}

function drawChart(items, fillColor, borderColor, borderWidth, largest = null) {
  if (!largest) largest = Math.max(...items);
  let range = actualWidth / items.length;

  ctx.beginPath();
  ctx.moveTo(range * 0 + MARGIN.LEFT, actualHeight);
  items.forEach((item, index) => {
    ctx.lineTo(
      range * index + MARGIN.LEFT,
      actualHeight - (item / largest) * (actualHeight - MARGIN.TOP)
    );
  });

  ctx.lineTo(range * (items.length - 1) + MARGIN.LEFT, actualHeight);
  ctx.strokeStyle = borderColor;
  ctx.fillStyle = fillColor;
  ctx.lineWidth = borderWidth;
  ctx.fill();
  ctx.stroke();
  ctx.closePath();
}

/**
 * Draw the grid
 * @param {Array} items Array contains total of death rate in world per year
 * @param {Array} years Array contains array
 */
function drawGridAndLabels(items, years) {
  let range = actualWidth / items.length;

  //TODO: draw horizontal grid
  let largestData = Math.max(...items);

  let lineX = [0];
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    let temp = Math.ceil(largestData / 7);
    lineX.push(Math.ceil((sum += temp) / 5) * 5);
  }
  lineX = [...new Set(lineX)];

  let largestLine = Math.max(...lineX);
  lineX.forEach((line) => {
    let height =
      actualHeight - (line / largestLine) * (actualHeight - MARGIN.TOP);

    drawLine(
      MARGIN.LEFT,
      height,
      actualWidth + MARGIN.LEFT / 2,
      height,
      "#bbb",
      1
    );

    ctx.save();
    ctx.font = "15px Arial";
    ctx.fillStyle = "black";
    ctx.textAlign = "right";
    ctx.fillText(line, MARGIN.LEFT - 10, height + 5);
    ctx.restore();
  });

  //TODO: draw vertical grid
  ctx.beginPath();
  items.forEach((item, index) => {
    if (years[index] % 5 !== 0 && index !== items.length - 1) return;
    drawLine(
      range * index + MARGIN.LEFT,
      MARGIN.TOP,
      range * index + MARGIN.LEFT,
      actualHeight,
      "#bbb",
      1
    );

    ctx.save();
    ctx.font = "15px Arial";
    ctx.fillStyle = "black";
    ctx.fillText(
      years[index],
      range * index - 20 + MARGIN.LEFT,
      actualHeight + MARGIN.BOTTOM
    );
    ctx.restore();
  });
  ctx.closePath();
}

/**
 * Helper for to draw the line
 * @param {Integer} startX start X coordinate
 * @param {Integer} startY start Y coordinate
 * @param {Integer} endX end X coordinate
 * @param {Integer} endY end Y coordinate
 * @param {String} color color of line
 * @param {Integer} width width of the line
 */
function drawLine(startX, startY, endX, endY, color, width) {
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.closePath();
}

/**
 * Helper for count the line based on the props passed to the function
 * @param {Array} years Array contains year from 1990-2017
 * @param {Array} countryData Array contains country's death rate
 * @param {String} prop Property to access countryData
 */
function countTotal(years, countryData, prop) {
  let result = [];

  for (const year of years) {
    let sum = countryData[year].reduce(
      (country, value) => country + value[prop],
      0
    );
    result.push(sum);
  }

  return result;
}

function renderOption(cell) {
  let html;
  let countryNames = [...new Set(cell.map((c) => c[0]))];

  countryNames.forEach((name) => {
    html += `<option value="${name}">${name}</option>`;
  });

  select.innerHTML = html;
}
select.addEventListener("change", drawCountryChart);

function drawCountryChart() {
  ctx.clearRect(0, 0, w, h);
  let country = [];

  let res = cell.filter((cel) => {
    return cel[0] == this.value;
  });
  res.forEach((data) => {
    let [name, code, year, ozone, pollution, particulate] = data;
    country.push({
      name,
      code,
      year,
      ozone: +ozone,
      pollution: +pollution,
      particulate: +particulate,
      totalPollution: +pollution + +particulate,
      total: +ozone + +pollution + +particulate,
    });
  });
  totalRate = country.map((rate) => rate.total);
  drawPerCountry(country);
}
