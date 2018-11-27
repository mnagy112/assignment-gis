using System;
using System.Collections.Generic;
using System.Linq;
using GeoJSON.Net.Feature;
using GeoJSON.Net.Geometry;
using Microsoft.EntityFrameworkCore.Internal;
using NetTopologySuite.Geometries;
using PDT.Entities;
using PDT.Utils;
using LineString = GeoJSON.Net.Geometry.LineString;
using Point = NetTopologySuite.Geometries.Point;
using Polygon = GeoJSON.Net.Geometry.Polygon;

namespace PDT.Services
{
	public class GisProvider : IGisProvider
	{
		private GisDBContext db;

		public GisProvider(GisDBContext database)
		{
			db = database;
		}

		public List<Feature> GetBajkStations(bool slovnaftBAjk, bool whiteBikes, Point position, double range)
		{
			return db.PlanetOsmPoint
				.Where(
					point => (point.Way.Distance(position) <= range * 1000 || range <= -1) &&
							 point.Amenity == "bicycle_rental" && 
					         (point.Operator == "Slovnaft" || !slovnaftBAjk) &&
					         (point.Operator == "WhiteBikes" || !whiteBikes) &&
					         point.Operator != null &&
					         point.Name != null
				)
				.Select(
					point => new Feature
					(
						new GeoJSON.Net.Geometry.Point
						(
							new Position
							(
								TransformationUtils.GetLatitude(point.Way.Y), 
								TransformationUtils.GetLongitude(point.Way.X),
								null
							)
						),
						new Dictionary<string, dynamic>
						{
							{"Id", point.Id},
							{"Name", point.Name},
							{"StationId", Convert.ToInt32(point.Ref)},
							{"Type", point.Operator == "Slovnaft" ? 0 : 1}
						},
						null
					)
				)
				.ToList();
		}

		public List<Feature> GetCycleWays(Point position, double range)
		{
			return db.PlanetOsmLine
				.Where(line => 
					(line.Way.Distance(position) <= range * 1000 || range <= -1) &&
					line.Highway == "cycleway"
				)
				.Select(line => 
					new Feature
					(
						new LineString
						(
							line.Way.Coordinates
								.Select(c => new []
									{
										TransformationUtils.GetLongitude(c.X),
										TransformationUtils.GetLatitude(c.Y)
									}
								)
						),
						new Dictionary<string, dynamic>
						{
							{"Id", line.Id},
							{"IsDesignated", line.Bicycle == "designated"}
						},
						null
					)
				)
				.ToList();
		}

		public List<Feature> GetNearbyCycleWays(long bicycleStationId)
		{
			return db.PlanetOsmPoint
				.Where(
					point => point.Id == bicycleStationId
				)
				.SelectMany(
					point => db.PlanetOsmLine
						.Where(
							line => line.Highway == "cycleway" &&
									line.Way.Distance(point.Way) < 1000
						)
				)
				.Select(
					line => new Feature
					(
						new LineString
						(
							line.Way.Coordinates
								.Select(c => new []
									{
										TransformationUtils.GetLongitude(c.X),
										TransformationUtils.GetLatitude(c.Y)
									}
								)
						),
						new Dictionary<string, dynamic>
						{
							{"Id", line.Id},
							{"IsDesignated", line.Bicycle == "designated"}
						},
						null
					)
				)
				.ToList();
		}

		public List<Feature> GetAdministrativeBordersFiltered()
		{
			return db.PlanetOsmLine
				.Where(line => line.Highway == "cycleway")
				.SelectMany(line =>
					db.PlanetOsmPoint
						.Where(point => 
							point.Amenity == "bicycle_rental" && 
							(point.Operator == "Slovnaft" || point.Operator == "WhiteBikes") &&
							point.Operator != null &&
							point.Name != null
						)
						.SelectMany(point => 
							db.PlanetOsmPolygon
								.Where(polygon =>
									polygon.AdminLevel == "9" &&
									polygon.Boundary == "administrative" &&
									(polygon.Way.Intersects(line.Way) ||
									polygon.Way.Contains(point.Way))
								)
						)
				)
				.GroupBy(polygon => 
						new
						{
							polygon.Way, 
							polygon.Id, 
							polygon.Name
						},
					(key, group) => new 
					{
						key.Way,
						key.Id,
						key.Name
					}
				)
				.ToList()
				.Select(polygon => 
					new Feature
					(
						new Polygon
						(
							new []
							{
								polygon.Way.Boundary.Coordinates
									.Select(c => new[]
										{
											TransformationUtils.GetLongitude(c.X),
											TransformationUtils.GetLatitude(c.Y)
										}
									)
									.ToList()
							}
						),
						new Dictionary<string, dynamic>
						{
							{"Id", polygon.Id},
							{"Name", polygon.Name}
						},
						null
					)
				)
				.ToList();
		}

		public List<Feature> GetAdministrativeBorders()
		{
			return db.PlanetOsmPolygon
				.Where(polygon =>
					polygon.AdminLevel == "9" &&
					polygon.Boundary == "administrative"
				)
				.Select(polygon =>
					new Feature
					(
						new Polygon
						(
							new []
							{
								polygon.Way.Boundary.Coordinates
									.Select(c => new[]
										{
											TransformationUtils.GetLongitude(c.X),
											TransformationUtils.GetLatitude(c.Y)
										}
									)
									.ToList()
							}
						),
						new Dictionary<string, dynamic>
						{
							{"Id", polygon.Id},
							{"Name", polygon.Name}
						},
						null
					)
				)
				.ToList();
		}

		public List<Feature> GetStationsInsideArea(long areaId)
		{
			return db.PlanetOsmPolygon
				.Where(
					polygon => polygon.Id == areaId
				)
				.SelectMany(
					polygon => db.PlanetOsmPoint
						.Where(point => 
							point.Amenity == "bicycle_rental" && 
							(point.Operator == "Slovnaft" || point.Operator == "WhiteBikes") &&
							point.Operator != null &&
							point.Name != null &&
							point.Way.Within(polygon.Way)
						)
				)
				.Select(
					point => new Feature
					(
						new GeoJSON.Net.Geometry.Point
						(
							new Position
							(
								TransformationUtils.GetLatitude(point.Way.Y), 
								TransformationUtils.GetLongitude(point.Way.X),
								null
							)
						),
						new Dictionary<string, dynamic>
						{
							{"Id", point.Id},
							{"Name", point.Name},
							{"StationId", Convert.ToInt32(point.Ref)},
							{"Type", point.Operator == "Slovnaft" ? 0 : 1}
						},
						null
					)
				)
				.ToList();
		}

		public List<Feature> GetCycleWaysInsideArea(long areaId)
		{
			return db.PlanetOsmPolygon
				.Where(
					polygon => polygon.Id == areaId
				)
				.SelectMany(
					polygon => db.PlanetOsmLine
						.Where(line => 
							line.Highway == "cycleway" &&
							line.Way.Intersects(polygon.Way)
						)
				)
				.Select(
					line => new Feature
					(
						new LineString
						(
							line.Way.Coordinates
								.Select(c => new []
									{
										TransformationUtils.GetLongitude(c.X),
										TransformationUtils.GetLatitude(c.Y)
									}
								)
						),
						new Dictionary<string, dynamic>
						{
							{"Id", line.Id},
							{"IsDesignated", line.Bicycle == "designated"}
						},
						null
					)
				)
				.ToList();
		}

		public List<Feature> GetStatisticsForAreas()
		{
			var stations = db.PlanetOsmPoint
				.Where(point =>
					point.Amenity == "bicycle_rental" &&
					(point.Operator == "Slovnaft" || point.Operator == "WhiteBikes") &&
					point.Operator != null &&
					point.Name != null
				)
				.SelectMany(point =>
					db.PlanetOsmPolygon
						.Where(polygon =>
							polygon.AdminLevel == "9" &&
							polygon.Boundary == "administrative" &&
							polygon.Way.Contains(point.Way)
						)
				)
				.GroupBy(polygon => polygon.Id,
					(key, group) => new
					{
						key,
						Count = group.Count()
					}
				)
				.ToList();
			
			var ways = db.PlanetOsmLine
				.Where(line =>
					line.Highway == "cycleway"
				)
				.SelectMany(line =>
					db.PlanetOsmPolygon
						.Where(polygon =>
							polygon.AdminLevel == "9" &&
							polygon.Boundary == "administrative" &&
							polygon.Way.Intersects(line.Way)
						)
				)
				.GroupBy(polygon => polygon.Id,
					(key, group) => new
					{
						key,
						Count = group.Count()
					}
				)
				.ToList();

			var polygons = db.PlanetOsmPolygon
				.Where(polygon =>
					polygon.AdminLevel == "9" &&
					polygon.Boundary == "administrative"
				)
				.Select(polygon =>
					new PolygonStatistics
					{
						Id = polygon.Id,
						Area = polygon.Way.Area,
						Way = polygon.Way,
						Name = polygon.Name
					}
				)
				.ToList();
				
			return polygons.GroupJoin(stations,
					polygon => polygon.Id,
					station => station.key,
					(polygon, station) => new PolygonStatistics
					{
						Id = polygon.Id,
						Area = polygon.Way.Area,
						Way = polygon.Way,
						Name = polygon.Name,
						StationCount = station.Where(s => s.key == polygon.Id).Select(s => s.Count).FirstOr(0)
					}
				)
				.GroupJoin(ways,
					polygon => polygon.Id,
					way => way.key,
					(polygon, way) => new PolygonStatistics
					{
						Id = polygon.Id,
						Area = polygon.Way.Area,
						Way = polygon.Way,
						Name = polygon.Name,
						StationCount = polygon.StationCount,
						WayCount = way.Where(s => s.key == polygon.Id).Select(s => s.Count).FirstOr(0)
					}
				)
				.Where(polygon => polygon.Name != null)
				.Select(polygon =>
					new Feature
					(
						new Polygon
						(
							new []
							{
								polygon.Way.Boundary.Coordinates
									.Select(c => new[]
										{
											TransformationUtils.GetLongitude(c.X),
											TransformationUtils.GetLatitude(c.Y)
										}
									)
									.ToList()
							}
						),
						new Dictionary<string, dynamic>
						{
							{"Id", polygon.Id},
							{"Name", polygon.Name},
							{"Size", Math.Round(polygon.Area * Math.Pow(0.3048,2) / 1000000, 2)},
							{"StationCount", polygon.StationCount},
							{"WayCount", polygon.WayCount}
						}
					)
				)
				.ToList();
		}
	}

	public class PolygonStatistics
	{
		public long Id { get; set; }
		public string Name { get; set; }
		public double Area { get; set; }
		public Geometry Way { get; set; }
		public int StationCount { get; set; }
		public int WayCount { get; set; }
	}
}
