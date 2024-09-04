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

async function getGA4Data(metrics, dimensions) {
  try {
    await googleJWT.authorize();

    const response = await analyticsData.properties.runReport({
      auth: googleJWT,
      property: `properties/${GA4_PROPERTY_ID}`,
      requestBody: {
        dateRanges: [{
          // startDate: "30daysAgo",
          startDate: "2024-09-01",
          endDate: "today"
        }],
        metrics: metrics,
        dimensions: dimensions
      }
    });
console.log('the response',response)
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

    return parsedData;

  } catch (err) {
    console.error(err);
    return null;
  }
}

async function fetchData() {
  try {
    // console.log('Fetching page data...');
    const pageData = await getGA4Data(

      [
        { name: "activeUsers" },
        { name: "totalUsers" },
        { name: "newUsers" },
        { name: "sessions" },
        { name: "userEngagementDuration" },
        { name: "screenPageViews" },
        { name: "averageSessionDuration" },
      ],
      [
        { name: "date" },
        { name: "pagePath" },
        { name: "city" },
        { name: "country" },
        { name: "language" },
        { name: "languageCode" },
        { name: "deviceCategory" },
        { name: "browser" },
        { name: "operatingSystemWithVersion" }
      ]
    );
    // console.log('Fetching micro user data...');
    const userData = await getGA4Data(

      [
        { name: "activeUsers" },
        { name: "totalUsers" },
        { name: "newUsers" },
        // { name: "sessions" },
        // { name: "userEngagementDuration" },
        // { name: "screenPageViews" },
        // { name: "averageSessionDuration" },
      ],
      [
        { name: "date" },
        // { name: "minute" },
        // { name: "hour" },
        // { name: "dateHourMinute" },
        { name: "pagePath" },
        // { name: "city" },
        // { name: "country" },
        // { name: "language" },
        // { name: "languageCode" },
        // {name:"deviceCategory"},
        // {name:"browser"},
        // {name:"operatingSystemWithVersion"}
      ]
    );
    // console.log('Fetching micro user event data...');
    const eventData = await getGA4Data(
      [
        // { name: "eventName" },  // Assuming this is a valid metric
        { name: "eventCount" },
        // { name: "eventValue" },  
      ],
      [
        { name: "date" },
        { name: "eventName" },  // This is the dimension for the date
        // Additional dimensions can be uncommented and added here
      ]
    );

    // console.log(pageData !== null ? 'Fetched page data...': 'no data');
    // console.log('Fetching user data by location...');
    const userDataByLocation = await getGA4Data(
      [
        { name: "totalUsers" }
      ],
      [
        { name: "city" },
        { name: "country" },
        { name: "language" },
        { name: "deviceCategory" },
        { name: "date" }

        // {name:"deviceModel"}
      ],

    );
    // console.log('Fetching general user metrics...');
    const generalUserMetrics = await getGA4Data(
      [
        { name: "totalUsers" },
        { name: "newUsers" },
        { name: "sessions" },
        { name: "screenPageViewsPerSession" },
        { name: "averageSessionDuration" }
      ],
      [{ name: "date" }] // Add the date dimension to generalize the metrics across dates
    );

    console.log('Fetching trafficAcquisitionData...');
    const trafficAcquisitionData = await getGA4Data(
      [
        { name: "activeUsers" },

        // { name: "totalUsers" },
        // { name: "newUsers" }

      ],
      [
        { name: "date" },
        // { name: "defaultChannelGroup" },
        // {name:"sourceMedium"},
        { name: "medium" },
        { name: "source" },
        { name: "country" },
        { name: "city" },
        { name: "newVsReturning" },
        // { name: "averageSessionDuration" }

      ]
    );
    // console.log({
    //   'Page Data:': pageData,
    //   'User Data By Location': userDataByLocation,
    //   'General User Metrics': generalUserMetrics,

    // })
    // console.log('Page Data:', pageData);
    // console.log('User Data By Location:', userDataByLocation);
    // console.log('General User Metrics:', generalUserMetrics);


    // Combine all the fetched data into a single object
    const combinedData = {
      pageData,
      userData,
      eventData,
      userDataByLocation,
      generalUserMetrics,
      trafficAcquisitionData
    };
    console.log('combined data',combinedData)
    return combinedData; // Return the combined data


  } catch (err) {
    console.error("Error fetching data:", err);
    return null;
  }
}

module.exports = {
  getGA4Data,
  fetchData
};
