using System;

namespace PDT.Utils
{
	public static class TransformationUtils
	{
		private const double MagicNumber = 20037508.34;
		
		public static double ParseLatitudeToGisFormat(double lat)
		{
			return Math.Log(Math.Tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180) * MagicNumber / 180;
		}
		
		public static double ParseLongitudeToGisFormat(double lon)
		{
			return lon * MagicNumber / 180;
		}
	}
}
