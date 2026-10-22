using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using APINwind.Data;
using APINwind.Models;

namespace APINwind.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SuppliersController : ControllerBase
    {
        private readonly ContextoBD _context;

        public SuppliersController(ContextoBD context)
        {
            _context = context;
        }

        // GET: api/Suppliers
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetSuppliers()
        {
            return await _context.Suppliers
                .Select(s => new
                {
                    s.SupplierId,
                    s.CompanyName
                })
                .ToListAsync();
        }
    }
}