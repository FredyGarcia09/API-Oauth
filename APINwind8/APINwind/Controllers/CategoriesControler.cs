using APINwind.Data;
using APINwind.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace APINwind.Controllers
{
    [Authorize(Policy = "loggedIn")]
    [Route("api/[controller]")]
    [ApiController]
    public class CategoriesController : ControllerBase
    {
        private readonly ContextoBD _context;

        public CategoriesController(ContextoBD context)
        {
            _context = context;
        }

        // GET: api/Categories
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetCategories()
        {
            return await _context.Categories
                .Select(c => new
                {
                    c.CategoryId,
                    c.CategoryName,
                    c.Description
                })
                .ToListAsync();
        }
    }
}