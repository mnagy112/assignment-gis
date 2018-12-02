using System;
using System.Collections.Generic;
using System.Linq;
using GeoJSON.Net.Feature;
using GeoJSON.Net.Geometry;
using Microsoft.EntityFrameworkCore;
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
		private readonly GisDBContext _db;

		public GisProvider(GisDBContext database)
		{
			_db = database;
		}

		public List<Feature> GetBajkStations(bool slovnaftBAjk, bool whiteBikes, Point position, double range)
		{
			return _db.PlanetOsmPoint
				.FromSql("SELECT id, ST_TRANSFORM(way, 4326) as way_computed, way, amenity, operator, name, ref from planet_osm_point")
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
								point.WayComputed.Y, 
								point.WayComputed.X,
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
			return _db.PlanetOsmLine
				.FromSql("SELECT id, ST_TRANSFORM(way, 4326) as way_computed, way, highway, bicycle from planet_osm_line")
				.Where(line => 
					(line.Way.Distance(position) <= range * 1000 || range <= -1) &&
					line.Highway == "cycleway"
				)
				.Select(line => 
					new Feature
					(
						new LineString
						(
							line.WayComputed.Coordinates
								.Select(c => new []
									{
										c.X,
										c.Y
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
			return _db.PlanetOsmPoint
				.Where(
					point => point.Id == bicycleStationId
				)
				.SelectMany(
					point => _db.PlanetOsmLine
						.FromSql("SELECT id, ST_TRANSFORM(way, 4326) as way_computed, way, highway, bicycle from planet_osm_line")
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
							line.WayComputed.Coordinates
								.Select(c => new []
									{
										c.X,
										c.Y
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

		public List<Feature> GetAdministrativeBorders()
		{
			return _db.PlanetOsmPolygon
				.FromSql("SELECT id, ST_TRANSFORM(way, 4326) as way_computed, way, name, admin_level, boundary from planet_osm_polygon")
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
								polygon.WayComputed.Boundary.Coordinates
									.Select(c => new[]
										{
											c.X,
											c.Y
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
			return _db.PlanetOsmPolygon
				.Where(
					polygon => polygon.Id == areaId
				)
				.SelectMany(
					polygon => _db.PlanetOsmPoint
						.FromSql("SELECT id, ST_TRANSFORM(way, 4326) as way_computed, way, amenity, operator, name, ref from planet_osm_point")
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
								point.WayComputed.Y, 
								point.WayComputed.X,
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
			return _db.PlanetOsmPolygon
				.Where(
					polygon => polygon.Id == areaId
				)
				.SelectMany(
					polygon => _db.PlanetOsmLine
						.FromSql("SELECT id, ST_TRANSFORM(way, 4326) as way_computed, way, highway, bicycle from planet_osm_line")
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
							line.WayComputed.Coordinates
								.Select(c => new []
									{
										c.X,
										c.Y
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
			var stations = _db.PlanetOsmPoint
				.Where(point =>
					point.Amenity == "bicycle_rental" &&
					(point.Operator == "Slovnaft" || point.Operator == "WhiteBikes") &&
					point.Operator != null &&
					point.Name != null
				)
				.SelectMany(point =>
					_db.PlanetOsmPolygon
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
			
			var ways = _db.PlanetOsmLine
				.Where(line =>
					line.Highway == "cycleway"
				)
				.SelectMany(line =>
					_db.PlanetOsmPolygon
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

			var polygons = _db.PlanetOsmPolygon
				.FromSql("SELECT id, ST_TRANSFORM(way, 2249) as way_computed, ST_TRANSFORM(way, 4326) as way, name, admin_level, boundary from planet_osm_polygon")
				.Where(polygon =>
					polygon.AdminLevel == "9" &&
					polygon.Boundary == "administrative"
				)
				.Select(polygon =>
					new PolygonStatistics
					{
						Id = polygon.Id,
						Area = polygon.WayComputed.Area,
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
						Area = polygon.Area,
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
						Area = polygon.Area,
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
											c.X,
											c.Y
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
