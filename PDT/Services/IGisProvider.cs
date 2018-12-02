using System.Collections.Generic;
using GeoJSON.Net.Feature;
using NetTopologySuite.Geometries;

namespace PDT.Services
{
	public interface IGisProvider
	{
		List<Feature> GetBajkStations(bool slovnaftBAjk, bool whiteBikes, Point position, double range);
		List<Feature> GetCycleWays(Point position, double range);
		List<Feature> GetNearbyCycleWays(long bicycleStationId);
		List<Feature> GetAdministrativeBorders();
		List<Feature> GetStationsInsideArea(long areaId);
		List<Feature> GetCycleWaysInsideArea(long areaId);
		List<Feature> GetStatisticsForAreas();
	}
}
