const { google } = require("googleapis");
const analyticsData = google.analyticsdata('v1beta');

const scopes = "https://www.googleapis.com/auth/analytics.readonly";
const GA4_PROPERTY_ID = "454361342";

const googleJWT = new google.auth.JWT(
  process.env.CLIENT_EMAIL,
  null,
  process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes
);

// Convert date to ISO 8601 format
// const formatToISO8601 = (dateString) => {
//   const year = dateString.slice(0, 4);
//   const month = dateString.slice(4, 6);
//   const day = dateString.slice(6, 8);
//   return `${year}-${month}-${day}T00:00:00Z`; // Assuming you want midnight UTC for simplicity
// };

async function getGA4Data(metrics, dimensions) {
  try {
    await googleJWT.authorize();

    const response = await analyticsData.properties.runReport({
      auth: googleJWT,
      property: `properties/${GA4_PROPERTY_ID}`,
      requestBody: {
        dateRanges: [{
          startDate: "2024-08-01",
          endDate: "today"
        }],
        metrics: metrics,
        dimensions: dimensions
      }
    });
    console.log('the response', response)
    const parsedData = response.data.rows.map(row => {
      let parsedRow = {};
      row.dimensionValues.forEach((dimension, index) => {
        parsedRow[dimensions[index].name] = dimension.value;
      });
      row.metricValues.forEach((metric, index) => {
        parsedRow[metrics[index].name] = metric.value;
      });
      return parsedRow;
    });
    // console.log('response',response)
    //     // Map the response and format the date field to ISO 8601
    //     const parsedData = response.data.rows.map(row => {
    //       console.log('row', row)
    //       let parsedRow = {};
    //       row.dimensionValues.forEach((dimension, index) => {
    //         parsedRow[dimensions[index].name] = dimension.name === "date"
    //           ? formatToISO8601(dimension.value)
    //           : dimension.value;
    //       });
    //       row.metricValues.forEach((metric, index) => {
    //         parsedRow[metrics[index].name] = metric.value;
    //       });
    //       return parsedRow;
    //     });
    console.log('parsed data', parsedData)
    return parsedData;
  } catch (err) {
    console.error(err);
    return null;
  }
}

async function fetchData() {
  try {
    const visitorSnapshot = await getGA4Data(
      [
        { name: "totalUsers" },
        { name: "newUsers" },
        { name: "activeUsers" },

        { name: "screenPageViews" },
        { name: "sessions" },
      ],
      [
        { name: "pagePath" },
        { name: "languageCode" },
        { name: "region" },
        { name: "city" },
        { name: "country" },
        { name: "date" },
      ]
    );
    const technicalSnapshot = await getGA4Data(
      [
        { name: "totalUsers" }, { name: "newUsers" },
        { name: "activeUsers" },

        { name: "screenPageViews" },
        // { name: "sessions" }, { name: "averageSessionDuration" },
      ],
      [
        { name: "pagePath" },
        { name: 'screenResolution' },
        { name: 'operatingSystem' },
        { name: 'mobileDeviceBranding' },
        { name: 'mobileDeviceModel' },
        { name: 'deviceCategory' },
        { name: "date" },
      ]
    );
    const pageSnapshot = await getGA4Data(
      [
        { name: "totalUsers" },
        { name: "newUsers" },
        { name: "activeUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
        { name: "averageSessionDuration" },
      ],
      [
        { name: "pagePath" },
        { name: "landingPage" },
        // { name: "landingPagePlusQueryString" },
        // {name:"pageReferrer"},
        { name: "region" },
        { name: "city" },
        { name: "country" },
        { name: "date" },

      ]
    );
    // PORTAL DASHBOARD
    const appDataOverview = await getGA4Data(
      [
        { name: "totalUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
        { name: "eventCount" },
      ],
      [
        { name: "pagePath" },
        { name: "landingPage" },
        { name: "eventName" },
        { name: "region" },
        { name: "city" },
        { name: "country" },
        { name: "date" },
      ]
    )
    const techDataOverview = await getGA4Data(
      [
        { name: "totalUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
        { name: "eventCount" },
      ],
      [
        { name: "pagePath" },
        { name: "landingPage" },
        { name: "eventName" },
        { name: 'screenResolution' },
        { name: 'operatingSystem' },
        { name: 'mobileDeviceBranding' },
        { name: 'mobileDeviceModel' },
        { name: 'deviceCategory' },
        { name: "date" },
      ]
    )

    const searchDataOverview = await getGA4Data(
      [
        { name: "totalUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
        { name: "eventCount" },
      ],
      [
        { name: "pagePath" },
        { name: "landingPage" },
        { name: "eventName" },
        { name: "customEvent:productName" },
        { name: "customEvent:productCategory" },
        { name: "customEvent:productSubcategory" },
        { name: "customEvent:searchType" },
        { name: "customEvent:searchQuery" },
        { name: "date" },
      ]
    )

    const resourceDataOverview = await getGA4Data(
      [
        { name: "totalUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
        { name: "eventCount" },
      ],
      [
        { name: "pagePath" },
        { name: "landingPage" },
        { name: "eventName" },
        { name: "customEvent:productName" },
        { name: "customEvent:productCategory" },
        { name: "customEvent:productSubcategory" },
        { name: "customEvent:resourceType" },
        { name: "customEvent:destinationUrl" },
        { name: "date" },
      ]
    );
    const printDataOverview = await getGA4Data(
      [
        { name: "totalUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
        { name: "eventCount" },
      ],
      [
        { name: "pagePath" },
        { name: "landingPage" },
        { name: "eventName" },
        { name: "customEvent:postPrintListAction" },
        { name: "customEvent:productsInList" },
        { name: "date" },
      ]
    );
   
    const searchQuerySnapshot = await getGA4Data(
      [
        // { name: "totalUsers" },
        // { name: "newUsers" },
        // { name: "activeUsers" },
        { name: "eventCount" },
      ],
      [
        // { name: "pagePath" },
        { name: "eventName" },

        { name: "customEvent:productName" },
        { name: "customEvent:productCategory" },
        { name: "customEvent:productSubcategory" },

        { name: "customEvent:searchType" },
        { name: "customEvent:searchQuery" },
        // { name: "customEvent:searchResultsCount" }, 

        { name: "date" },
      ]


    );

    const printEventSnapshot = await getGA4Data(
      [
        { name: "totalUsers" },
        { name: "newUsers" },
        { name: "activeUsers" },
        { name: "eventCount" },
        { name: "averageSessionDuration" },
      ],
      [
        { name: "eventName" },
        { name: "customEvent:postPrintListAction" },
        { name: "customEvent:productsInList" },
        { name: "customEvent:productCount" },
        { name: "date" },
      ]
    );
    const productEventSnapshot = await getGA4Data(
      [
        { name: "totalUsers" },
        { name: "newUsers" },
        { name: "activeUsers" },
        { name: "eventCount" },
        { name: "averageSessionDuration" },
      ],
      [
        { name: "eventName" },
        { name: "customEvent:productName" },
        { name: "customEvent:productCategory" },
        { name: "customEvent:productSubcategory" },
        { name: "customEvent:resourceType" },
        { name: "customEvent:destinationUrl" },
        { name: "pagePath" },
        { name: "date" },
      ]
    );
    const eventGeoLocationSnapshot = await getGA4Data(
      [
        { name: "totalUsers" },
        { name: "newUsers" },
        { name: "activeUsers" },
        { name: "eventCount" },
        { name: "averageSessionDuration" },
      ],
      [
        { name: "eventName" },
        { name: "region" },
        { name: "city" },
        { name: "country" },
        { name: "date" },
      ]
    );


    const combinedData = {
      visitorSnapshot,
      technicalSnapshot,
      pageSnapshot,
      // searchEventSnapshot,
      // resourceEventSnapshot,
      printEventSnapshot,
      productEventSnapshot,
      eventGeoLocationSnapshot,
      searchQuerySnapshot,

      appDataOverview,
      techDataOverview,
      searchDataOverview,
      printDataOverview,
      resourceDataOverview,
    };
    console.log('combined data', combinedData.searchQuerySnapshot)
    return combinedData;
  } catch (err) {
    console.error("Error fetching data:", err);
    return null;
  }
}

module.exports = {
  getGA4Data,
  fetchData
};
