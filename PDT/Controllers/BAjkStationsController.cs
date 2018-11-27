using System;
using System.Collections.Generic;
using System.Linq;
using GeoAPI.Geometries;
using GeoJSON.Net.Feature;
using HtmlAgilityPack;
using Microsoft.AspNetCore.Mvc;
using NetTopologySuite.Geometries;
using PDT.Services;
using PDT.Utils;

namespace PDT.Controllers
{
    [Route("api/[controller]")]
    public class BAjkStationsController : Controller
    {
        private IGisProvider gis;

        private Dictionary<int, string[]> getSlovnaftBAjkData()
        {
            var res = new Dictionary<int, string[]>();
            
            var web = new HtmlWeb();
            var htmlDoc = web.Load("https://slovnaftbajk.sk/mapa-stanic");
            var nodes = htmlDoc.DocumentNode.SelectNodes("//*/table[@class=\"responsiveTable\"]/tr[@class=\"trStation\"]");
            
            foreach (var node in nodes)
            {
                var doc = new HtmlDocument();
                doc.LoadHtml(node.OuterHtml);
	            
                var id = Int32.Parse(doc.DocumentNode.SelectSingleNode("//*/td[@data-title=\"Číslo stanice\"]").InnerHtml);
                var value = doc.DocumentNode.SelectSingleNode("//*/td[@data-title=\"Bicykle\"]").InnerHtml.Split('/');

                res.Add(id, value);
            }

            return res;
        }
        
        public BAjkStationsController(IGisProvider gisProvider)
        {
            gis = gisProvider;
        }

        [HttpGet("[action]")]
        public ActionResult<FeatureCollection> GetStations(double lat, double lon, bool slovnaftBAjk, bool whiteBikes, double distance)
        {
            var position = new Point(
                new Coordinate
                {
                    X = TransformationUtils.ParseLongitudeToGisFormat(lon),
                    Y = TransformationUtils.ParseLatitudeToGisFormat(lat)
                }
            )
            {
                SRID = 3857
            };
            
            var stations = gis.GetBajkStations(slovnaftBAjk, whiteBikes, position, distance);

            if (whiteBikes)
                return Ok(stations);

            var liveData = getSlovnaftBAjkData();

            return Ok(
                new FeatureCollection
                (
                    stations
                    .Select(station => 
                        new Feature
                        (
                            station.Geometry,
                            new Dictionary<string, dynamic>
                            {
                                {"Id", station.Properties["Id"]},
                                {"Name", station.Properties["Name"]},
                                {"Size", Int32.Parse(liveData.ContainsKey(Convert.ToInt32(station.Properties["StationId"])) ? liveData[Convert.ToInt32(station.Properties["StationId"])][1] : "0")},
                                {"Ready", Int32.Parse(liveData.ContainsKey(Convert.ToInt32(station.Properties["StationId"])) ? liveData[Convert.ToInt32(station.Properties["StationId"])][0] : "0")},
                                {"Type", station.Properties["Type"]}
                            }
                        )
                    )
                    .ToList()
                )
            );
        }

        [HttpGet("[action]")]
        public ActionResult<FeatureCollection> GetCycleWays(double lat, double lon, double distance)
        {
            var position = new Point(
                new Coordinate
                {
                    X = TransformationUtils.ParseLongitudeToGisFormat(lon),
                    Y = TransformationUtils.ParseLatitudeToGisFormat(lat)
                }
            )
            {
                SRID = 3857
            };
            
            return Ok(new FeatureCollection(gis.GetCycleWays(position, distance)));
        }

        [HttpGet("[action]")]
        public ActionResult<FeatureCollection> GetNearbyCycleWays(long stationId)
        {
            return Ok(new FeatureCollection(gis.GetNearbyCycleWays(stationId)));
        }

        [HttpGet("[action]")]
        public ActionResult<FeatureCollection> GetAdministrativeBordersFiltered()
        {
            return Ok(new FeatureCollection(gis.GetAdministrativeBordersFiltered()));
        }

        [HttpGet("[action]")]
        public ActionResult<FeatureCollection> GetAdministrativeBorders()
        {
            return Ok(new FeatureCollection(gis.GetAdministrativeBorders()));
        }

        [HttpGet("[action]")]
        public ActionResult<FeatureCollection> GetStationsAndWaysInsideArea(long areaId)
        {
            var stations = gis.GetStationsInsideArea(areaId);
            var ways = gis.GetCycleWaysInsideArea(areaId);
            
            var liveData = getSlovnaftBAjkData();
                       
            return Ok(
                new
                {
                    Stations = new FeatureCollection
                    (
                        stations
                            .Select(station => 
                                new Feature
                                (
                                    station.Geometry,
                                    new Dictionary<string, dynamic>
                                    {
                                        {"Id", station.Properties["Id"]},
                                        {"Name", station.Properties["Name"]},
                                        {"Size", Int32.Parse(liveData.ContainsKey(Convert.ToInt32(station.Properties["StationId"])) ? liveData[Convert.ToInt32(station.Properties["StationId"])][1] : "0")},
                                        {"Ready", Int32.Parse(liveData.ContainsKey(Convert.ToInt32(station.Properties["StationId"])) ? liveData[Convert.ToInt32(station.Properties["StationId"])][0] : "0")},
                                        {"Type", station.Properties["Type"]}
                                    }
                                )
                            )
                            .ToList()
                    ),
                    Ways = new FeatureCollection(ways)
                }
            );
        }

        [HttpGet("[action]")]
        public ActionResult<FeatureCollection> GetStatisticsForAreas()
        {
            return Ok(new FeatureCollection(gis.GetStatisticsForAreas()));
        }
    }
}