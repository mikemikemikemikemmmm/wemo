
using NetTopologySuite.Geometries;
namespace App.Helpers
{
    public static class GeoHelpers
    {
        private static GeometryFactory factory = new GeometryFactory(
            new PrecisionModel(PrecisionModels.FloatingSingle),
            Const.SRID
        );
        public static Point CreatePoint(double lon, double lat)
        {
            return new Point(lon, lat) { SRID = Const.SRID };
        }
        public static Polygon CreatePolygon(GeoJsonFeature<GeometryPolygon> polygonFeature)
        {
            var coordinates = polygonFeature.geometry.coordinates[0]
                .Select(coord => new Coordinate(coord[0], coord[1]))
                .ToArray();
            var shell = factory.CreateLinearRing(coordinates);
            return factory.CreatePolygon(shell);
        }
        public class GeoJsonFeature<T> where T : Geometry
        {
            public string type = "Feature";
            public required Properties properties { get; set; }
            public required T geometry { get; set; }
        }
        public class Properties
        {

        }

        public class Geometry
        {
            public virtual string type { get; set; } = null!;
            public required List<List<List<double>>> coordinates { get; set; }
        }
        public class GeometryPolygon : Geometry
        {
            public GeometryPolygon()
            {
                type = "Polygon";
            }
        }
    }
}