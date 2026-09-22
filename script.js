const root = am5.Root.new("chartdiv");

root.setThemes([
    am5themes_Animated.new(root)
]);

const chart = root.container.children.push(
    am5map.MapChart.new(root, {
        projection: am5map.geoMercator(),
        panX: "translateX",
        panY: "translateY",
        wheelX: "zoom",
        wheelY: "zoom"
    })
);

const polygonSeries = chart.series.push(
    am5map.MapPolygonSeries.new(root, {
        geoJSON: am5geodata_worldLow
    })
);

polygonSeries.mapPolygons.template.setAll({
    fill: am5.color(0x1e293b),
    fillOpacity: 1,
    stroke: am5.color(0x475569),
    strokeWidth: 0.5
});

chart.set("zoomControl", am5map.ZoomControl.new(root, {}));

const pointSeries = chart.series.push(
    am5map.MapPointSeries.new(root, {
        latitudeField: "latitude",
        longitudeField: "longitude"
    })
);

pointSeries.bullets.push(() => {
    const container = am5.Container.new(root, {});

    container.children.push(
        am5.Circle.new(root, {
            radius: 7,
            fill: am5.color(0xef4444),
            stroke: am5.color(0xffffff),
            strokeWidth: 2,
            tooltipText: "{name}"
        })
    );

    container.children.push(
        am5.Label.new(root, {
            text: "{name}",
            populateText: true,
            centerX: am5.p50,
            x: 0,
            y: -18,
            fontSize: 13,
            fill: am5.color(0xffffff),
            fontWeight: "500"
        })
    );

    return am5.Bullet.new(root, {
        sprite: container
    });
});

const sankeySeries = chart.series.push(
    am5map.MapSankeySeries.new(root, {
        polygonSeries: polygonSeries,
        maxWidth: 4,
        controlPointDistance: 0.4,
        nodeType: "circle",
        autoSort: true
    })
);

sankeySeries.mapPolygons.template.setAll({
    fill: am5.color(0x38bdf8),
    fillOpacity: 0.65,
    strokeOpacity: 0,
    tooltipText: "{from} → {to}\nValue: {value}"
});

sankeySeries.nodes.mapPolygons.template.setAll({
    fill: am5.color(0x0ea5e9),
    fillOpacity: 1,
    stroke: am5.color(0xffffff),
    strokeWidth: 1.5
});

const waypointMap = {
    "Shanghai-Beijing": [
        { longitude: 118, latitude: 34 }
    ],

    "Beijing-Dubai": [
        { longitude: 110, latitude: 32 },
        { longitude: 90, latitude: 28 },
        { longitude: 70, latitude: 25 }
    ],

    "Tehran-Dubai": [
        { longitude: 53, latitude: 31 },
        { longitude: 56, latitude: 28 }
    ],

    "Tehran-Istanbul": [
        { longitude: 42, latitude: 37 }
    ],

    "Dubai-Istanbul": [
        { longitude: 50, latitude: 28 },
        { longitude: 45, latitude: 31 }
    ],

    "Dubai-Frankfurt": [
        { longitude: 45, latitude: 32 },
        { longitude: 30, latitude: 38 },
        { longitude: 15, latitude: 45 }
    ],

    "Istanbul-Frankfurt": [
        { longitude: 35, latitude: 43 },
        { longitude: 25, latitude: 46 }
    ],

    "Istanbul-Paris": [
        { longitude: 30, latitude: 43 },
        { longitude: 20, latitude: 46 }
    ],

    "Frankfurt-London": [
        { longitude: 5, latitude: 51 }
    ],

    "Paris-London": [
        { longitude: 1, latitude: 50 }
    ],

    "London-New York": [
        { longitude: -20, latitude: 50 },
        { longitude: -45, latitude: 45 }
    ],

    "Frankfurt-Toronto": [
        { longitude: -10, latitude: 48 },
        { longitude: -40, latitude: 45 }
    ],

    "New York-Los Angeles": [
        { longitude: -95, latitude: 38 }
    ]
};

let previousData = null;

async function loadData() {
    try {
        const response = await fetch("/api/routes");

        if (!response.ok) {
            throw new Error(
                `API request failed: ${response.status} ${response.statusText}`
            );
        }

        const contentType = response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
            const text = await response.text();

            console.error(
                "API returned non-JSON data:",
                text.substring(0, 300)
            );

            throw new Error(
                "API did not return JSON. Check /api/routes on the server."
            );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("API response must be an array.");
        }

        const newData = JSON.stringify(data);

        if (newData === previousData) {
            return;
        }

        previousData = newData;

        const locations = {};

        data.forEach(item => {
            if (
                item.from &&
                item.fromLat !== undefined &&
                item.fromLng !== undefined
            ) {
                if (!locations[item.from]) {
                    locations[item.from] = {
                        name: item.from,
                        latitude: item.fromLat,
                        longitude: item.fromLng
                    };
                }
            }

            if (
                item.to &&
                item.toLat !== undefined &&
                item.toLng !== undefined
            ) {
                if (!locations[item.to]) {
                    locations[item.to] = {
                        name: item.to,
                        latitude: item.toLat,
                        longitude: item.toLng
                    };
                }
            }
        });

        pointSeries.data.setAll(
            Object.values(locations)
        );

        const sankeyData = data.map(item => {
            const key = `${item.from}-${item.to}`;

            return {
                sourceLongitude: item.fromLng,
                sourceLatitude: item.fromLat,

                targetLongitude: item.toLng,
                targetLatitude: item.toLat,

                waypoints: waypointMap[key] || [],

                from: item.from,
                to: item.to,
                value: item.value
            };
        });

        sankeySeries.data.setAll(sankeyData);

    } catch (error) {
        console.error("loadData error:", error);
    }
}

sankeySeries.bullets.push(() => {
    return am5.Bullet.new(root, {
        locationX: 0,

        autoRotate: true,

        sprite: am5.Circle.new(root, {
            radius: 3,
            fill: am5.color(0xffffff),
            stroke: am5.color(0x38bdf8),
            strokeWidth: 1
        })
    });
});

sankeySeries.events.on("datavalidated", () => {

    am5.array.each(
        sankeySeries.dataItems,
        dataItem => {

            const bullets = dataItem.bullets;

            if (bullets) {

                am5.array.each(
                    bullets,
                    bullet => {

                        const pathLength =
                            sankeySeries.getPathLength(dataItem);

                        const duration =
                            Math.max(2000, pathLength * 20);

                        bullet.animate({
                            key: "locationX",
                            from: 0,
                            to: 1,
                            duration: duration,
                            easing: am5.ease.linear,
                            loops: Infinity
                        });

                    }
                );

            }

        }
    );

});

loadData();

setInterval(
    loadData,
    5000
);

