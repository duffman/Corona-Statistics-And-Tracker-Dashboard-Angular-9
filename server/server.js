"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
const useRedis = false;
const db_client_1 = require("./core/dbcore/db-client");
const query_1 = require("./core/dbcore/query");
const local_mem_store_1 = require("./core/local-mem-store");
var express = require('express');
var app = express();
var axios = require("axios");
var cheerio = require("cheerio");
var cors = require('cors');
const config = require('./config.json');
const csv = require('csvtojson');
let basePathHistory = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/";
const memStore = new local_mem_store_1.LocalMemStore();
let corsOptions = {
    "credentials": true,
    "origin": "*",
    "useOldCorsMode": false
};
app.use(cors(corsOptions));
class Server {
    constructor() {
        this.db = new db_client_1.DbClient({
            dbHost: "localhost",
            dbName: "corona",
            dbUser: "duffman",
            dbPass: "bjoe7151212"
        });
    }
    setData(countryName, date, confirmed, deaths, recovered) {
        let query = new query_1.ZynSql().insert({
            "country_name": countryName,
            "date": date,
            "confirmed": confirmed,
            "deaths": deaths,
            "recovered": recovered
        }, "data");
    }
}
exports.Server = Server;
const keys = config.keys;
var getAll = () => __awaiter(this, void 0, void 0, function* () {
    let response;
    try {
        response = yield axios.get("https://www.worldometers.info/coronavirus/");
        if (response.status !== 200) {
            console.log("ERROR");
        }
    }
    catch (err) {
        return null;
    }
    // to store parsed data
    const result = {};
    // get HTML and parse death rates
    const html = cheerio.load(response.data);
    html(".maincounter-number").filter((i, el) => {
        let count = el.children[0].next.children[0].data || "0";
        count = parseInt(count.replace(/,/g, "") || "0", 10);
        // first one is
        if (i === 0) {
            result.cases = count;
        }
        else if (i === 1) {
            result.deaths = count;
        }
        else {
            result.recovered = count;
        }
    });
    result.updated = Date.now();
    const string = JSON.stringify(result);
    memStore.set(keys.all, string);
    console.log("Updated The Cases");
});
//console.log("SQL ::", query.toSql());
//process.exit(22);
var getCountries = () => __awaiter(this, void 0, void 0, function* () {
    let response;
    try {
        response = yield axios.get("https://www.worldometers.info/coronavirus/");
        if (response.status !== 200) {
            console.log("Error", response.status);
        }
    }
    catch (err) {
        return null;
    }
    // to store parsed data
    const result = [];
    // get HTML and parse death rates
    const html = cheerio.load(response.data);
    const countriesTable = html("table#main_table_countries_today");
    const countriesTableCells = countriesTable
        .children("tbody")
        .children("tr")
        .children("td");
    // NOTE: this will change when table format change in website
    const totalColumns = 12;
    const countryColIndex = 0;
    const casesColIndex = 1;
    const todayCasesColIndex = 2;
    const deathsColIndex = 3;
    const todayDeathsColIndex = 4;
    const curedColIndex = 5;
    const activeColIndex = 6;
    const criticalColIndex = 7;
    const casesPerOneMillionColIndex = 8;
    const deathsPerOneMillionColIndex = 9;
    // minus totalColumns to skip last row, which is total
    for (let i = 0; i < countriesTableCells.length - totalColumns; i += 1) {
        const cell = countriesTableCells[i];
        // get country
        if (i % totalColumns === countryColIndex) {
            let country = cell.children[0].data ||
                cell.children[0].children[0].data ||
                // country name with link has another level
                cell.children[0].children[0].children[0].data ||
                cell.children[0].children[0].children[0].children[0].data ||
                "";
            country = country.trim();
            if (country.length === 0) {
                // parse with hyperlink
                country = cell.children[0].next.children[0].data || "";
            }
            result.push({
                country
            });
        }
        // get cases
        if (i % totalColumns === casesColIndex) {
            let cases = cell.children.length != 0 ? cell.children[0].data : "";
            result[result.length - 1].cases = parseInt(cases.trim().replace(/,/g, "") || "0", 10);
        }
        // get today cases
        if (i % totalColumns === todayCasesColIndex) {
            let cases = cell.children.length != 0 ? cell.children[0].data : "";
            result[result.length - 1].todayCases = parseInt(cases.trim().replace(/,/g, "") || "0", 10);
        }
        // get deaths
        if (i % totalColumns === deathsColIndex) {
            let deaths = cell.children.length != 0 ? cell.children[0].data : "";
            result[result.length - 1].deaths = parseInt(deaths.trim().replace(/,/g, "") || "0", 10);
        }
        // get today deaths
        if (i % totalColumns === todayDeathsColIndex) {
            let deaths = cell.children.length != 0 ? cell.children[0].data : "";
            result[result.length - 1].todayDeaths = parseInt(deaths.trim().replace(/,/g, "") || "0", 10);
        }
        // get cured
        if (i % totalColumns === curedColIndex) {
            let cured = cell.children.length != 0 ? cell.children[0].data : "";
            result[result.length - 1].recovered = parseInt(cured.trim().replace(/,/g, "") || 0, 10);
        }
        // get active
        if (i % totalColumns === activeColIndex) {
            let cured = cell.children.length != 0 ? cell.children[0].data : "";
            result[result.length - 1].active = parseInt(cured.trim().replace(/,/g, "") || 0, 10);
        }
        // get critical
        if (i % totalColumns === criticalColIndex) {
            let critical = cell.children.length != 0 ? cell.children[0].data : "";
            result[result.length - 1].critical = parseInt(critical.trim().replace(/,/g, "") || "0", 10);
        }
        // get total cases per one million population
        if (i % totalColumns === casesPerOneMillionColIndex) {
            let casesPerOneMillion = cell.children.length != 0 ? cell.children[0].data : "";
            result[result.length - 1].casesPerOneMillion = parseFloat(casesPerOneMillion.trim().replace(/,/g, "") || "0");
        }
        // get total deaths per one million population
        if (i % totalColumns === deathsPerOneMillionColIndex) {
            let deathsPerOneMillion = cell.children.length != 0 ? cell.children[0].data : "";
            result[result.length - 1].deathsPerOneMillion = parseFloat(deathsPerOneMillion.trim().replace(/,/g, "") || "0");
        }
    }
    const string = JSON.stringify(result.filter(x => x.country != "World"));
    memStore.set(keys.countries, string);
    console.log(`Updated countries: ${result.length} countries`);
});
var getHistory = () => __awaiter(this, void 0, void 0, function* () {
    let history = yield axios.get(`https://pomber.github.io/covid19/timeseries.json`).then((response) => __awaiter(this, void 0, void 0, function* () {
        const res = response.data;
        const hKeys = Object.keys(res);
        let newHistory = [];
        for (let key of hKeys) {
            const newArr = res[key].map((_a) => {
                var { confirmed: cases } = _a, rest = __rest(_a, ["confirmed"]);
                return (Object.assign({ cases }, rest));
            });
            newHistory.push({
                country: key,
                timeline: newArr
            });
        }
        memStore.set(keys.timeline, JSON.stringify(newHistory));
        let globalTimeline = JSON.stringify(yield calculateAllTimeline(newHistory));
        memStore.set(keys.timelineglobal, globalTimeline);
        console.log(`Updated JHU CSSE Timeline`);
    }));
});
getCountries();
getAll();
getHistory();
setInterval(getCountries, config.interval);
setInterval(getAll, config.interval);
setInterval(getHistory, config.interval);
let calculateAllTimeline = (timeline) => __awaiter(this, void 0, void 0, function* () {
    let data = {};
    timeline.forEach((element) => __awaiter(this, void 0, void 0, function* () {
        element.timeline.forEach((o) => __awaiter(this, void 0, void 0, function* () {
            if (!data.hasOwnProperty(o.date)) {
                data[o.date] = {};
                data[o.date]["cases"] = 0;
                data[o.date]["deaths"] = 0;
                data[o.date]["recovered"] = 0;
            }
            data[o.date].cases += parseInt(o.cases);
            data[o.date].deaths += parseInt(o.deaths);
            data[o.date].recovered += parseInt(o.recovered);
        }));
    }));
    return data;
});
/****************************************************
 *
 *    Web Server
 *
 ***************************************************/
app.get("/", function (request, resp) {
    return __awaiter(this, void 0, void 0, function* () {
        // let a = JSON.parse(await memStore.get(keys.all));
        let data = yield memStore.get(keys.all);
        resp.json(JSON.parse(data));
        /*
        response.send(
            `${a.cases} cases are reported of the COVID-19<br> ${a.deaths} have died from it <br>\n${a.recovered} have recovered from it. <br>
        View the dashboard here : <a href="https://coronastatistics.live">coronastatistics.live</a>`
        );
        */
    });
});
let listener = app.listen(process.env.PORT || 5001, function () {
    console.log("Your app is listening on port " + listener.address().port);
});
app.get("/all/", function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let all = JSON.parse(yield memStore.get(keys.all));
        res.send(all);
    });
});
app.get("/countries/", function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let countries = JSON.parse(yield memStore.get(keys.countries));
        if (req.query['sort']) {
            try {
                const sortProp = req.query['sort'];
                countries.sort((a, b) => {
                    if (a[sortProp] < b[sortProp]) {
                        return -1;
                    }
                    else if (a[sortProp] > b[sortProp]) {
                        return 1;
                    }
                    return 0;
                });
            }
            catch (e) {
                console.error("ERROR while sorting", e);
                res.status(444).send(e);
                return;
            }
        }
        res.send(countries.reverse());
    });
});
app.get("/countries/:country", function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let countries = JSON.parse(yield memStore.get(keys.countries));
        let country = countries.find(e => e.country.toLowerCase().includes(req.params.country.toLowerCase()));
        if (!country) {
            res.send("false");
            return;
        }
        res.send(country);
    });
});
app.get("/timeline", function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let data = JSON.parse(yield memStore.get(keys.timeline));
        res.send(data);
    });
});
app.get("/timeline/global", function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let data = JSON.parse(yield memStore.get(keys.timelineglobal));
        res.send(data);
    });
});
app.get("/timeline/:country", function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let data = JSON.parse(yield memStore.get(keys.timeline));
        let country = data.find(e => e.country.toLowerCase() === req.params.country.toLowerCase());
        if (!country) {
            res.send(false);
            return;
        }
        country = data.filter(e => e.country.toLowerCase() === req.params.country.toLowerCase());
        if (country.length == 1) {
            res.send({
                multiple: false,
                name: country[0].country,
                data: country[0]
            });
            return;
        }
        res.send({
            multiple: true,
            name: country[0].country,
            data: country
        });
    });
});
