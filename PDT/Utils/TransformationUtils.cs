using System;

namespace PDT.Utils
{
	public static class TransformationUtils
	{
		private const double MagicNumber = 20037508.34;
		public static double GetLatitude(double y)
		{
			return (Math.Atan(Math.Pow(Math.E, Math.PI / 180 * (y / (MagicNumber / 180)))) / (Math.PI / 360)) - 90;
		}

		public static double GetLongitude(double x)
		{
			return x * 180 / MagicNumber;
		}
		
		public static double ParseLatitudeToGisFormat(double lat)
		{
			return Math.Log(Math.Tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180) * 20037508.34 / 180;
		}
		
		public static double ParseLongitudeToGisFormat(double lon)
		{
			return lon * 20037508.34 / 180;
		}
	}
}
