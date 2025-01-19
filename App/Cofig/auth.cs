public class AuthSettings
{
    public required string jwtSecretKey { get; set; }
    public int jwtExpiredDays { get; set; }
    public int saltSize { get; set; }
    public int hashSize { get; set; }
    public int hashIterations { get; set; }
}