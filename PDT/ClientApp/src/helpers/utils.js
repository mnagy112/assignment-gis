export default {
  
  getLineStyle: (feature) => {
    return feature.properties.IsDesignated ? {color: "green"} : {color: "red"};
  },

  getAreaPopupStyle: (area) => {
    return `
      <div style="text-align: center">
        <b>${area.Name}</b>
        <table class="PopupTable">
            <tbody>
              <tr>
                <th>Size</th>
                <td>${area.Size}km<sup>2</sup></td>
              </tr>
              <tr>
                <th>Bicycle stations</th>
                <td>${area.StationCount}</td>
              </tr>
              <tr>
                <th>Bicycle Ways</th>
                <td>${area.WayCount}</td>
              </tr>
            </tbody>
          </table>
      </div>`
  },

  getBikeStationPopupStyle: (station) => {
    return `
      <div style="text-align: center">
        <b>${station.Name}</b>
        <table class="PopupTable">
          <tbody>
            <tr>
              <th>Provider</th>
              <td>${station.Type === 0 ? "Slovnaft" : "WhiteBikes"}</td>
            </tr>
          </tbody>
        </table>
        ${station.Type === 0 ?
        `<table class="PopupTable">
            <tbody>
              <tr>
                <th>Free bikes</th>
                <td>${station.Ready}</td>
              </tr>
              <tr>
                <th>Free docks</th>
                <td>${station.Size - station.Ready}</td>
              </tr>
              <tr>
                <th>Station size</th>
                <td>${station.Size}</td>
              </tr>
            </tbody>
          </table>`
        : ""
        }
        <div style="margin-top: 10px; text-align: center">
          Click on marker to search for<br/>cycle paths near this point
        </div>
      </div>`
  }
}