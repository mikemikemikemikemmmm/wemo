using Microsoft.AspNetCore.Mvc;

namespace App.Controllers.v1
{
    [ApiController]
    [Route("v1/api/[controller]")]
    public class BaseApiController : ControllerBase { }

}