import L from "leaflet";
import {} from "mapbox-gl-leaflet";
import PropTypes from "prop-types";
import { GridLayer, withLeaflet } from "react-leaflet";

class MapBoxGLLayer extends GridLayer {
  createLeafletElement(props) {
    return L.mapboxGL(props);
  }
}

MapBoxGLLayer.propTypes = {
  accessToken: PropTypes.string.isRequired,
  style: PropTypes.string
};

MapBoxGLLayer.defaultProps = {
  style: "mapbox://styles/mapbox/streets-v9"
};

export default withLeaflet(MapBoxGLLayer);