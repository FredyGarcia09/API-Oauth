using System;
using System.ComponentModel.DataAnnotations;

namespace APINwind.Models
{
    public class Usuario
    {
        [Key]
        public int Id { get; set; }
        public string? Email { get; set; }
        public string? Nombre { get; set; }
    }
}
