/**
 * clientes.js - Gestion y consulta de clientes
 */

let tablaClientes = null;
let modalClienteInstance = null;
const modalClienteElement = document.getElementById('modalCliente');

// Cargar lista de clientes
async function cargarClientes() {
    try {
        const resultado = await apiFetch(API_ENDPOINTS.CUSTOMERS);
        if (!resultado.ok) return;

        const clientes = Array.isArray(resultado.data) ? resultado.data : [];

        const totalEl = document.getElementById('totalClientesCount');
        if (totalEl) {
            totalEl.textContent = `${clientes.length} clientes`;
        }

        if (tablaClientes) {
            tablaClientes.clear();
            tablaClientes.rows.add(clientes);
            tablaClientes.draw();
        } else {
            tablaClientes = new DataTable('#listaClientes', {
                data: clientes,
                responsive: true,
                language: {
                    search: "Buscar:",
                    lengthMenu: "Mostrar _MENU_ clientes",
                    info: "Mostrando _START_ a _END_ de _TOTAL_ clientes",
                    infoEmpty: "No hay clientes disponibles",
                    infoFiltered: "(filtrado de _MAX_ totales)",
                    zeroRecords: "No se encontraron clientes coincidentes",
                    paginate: {
                        first: "Primero",
                        last: "Último",
                        next: "Siguiente",
                        previous: "Anterior"
                    }
                },
                columns: [
                    { 
                        title: 'Código', 
                        data: 'customerId', 
                        width: '12%', 
                        className: 'text-center fw-bold text-dark font-monospace'
                    },
                    { 
                        title: 'Empresa', 
                        data: 'companyName',
                        render: (data) => `<span class="fw-semibold text-dark">${escapeHtml(data)}</span>`
                    },
                    { 
                        title: 'Contacto', 
                        data: 'contactName',
                        render: (data) => data ? escapeHtml(data) : '<span class="text-muted">Sin contacto</span>'
                    },
                    {
                        title: 'Acciones',
                        data: null,
                        orderable: false,
                        className: 'text-center',
                        width: '12%',
                        render: function (data, type, row) {
                            return `
                                <button type="button" class="btn btn-sm btn-outline-secondary" onclick="abrirModalCliente('${escapeHtml(row.customerId)}')">
                                    <i class="bi bi-eye me-1"></i> Ver
                                </button>
                            `;
                        }
                    }
                ]
            });
        }
    } catch (error) {
        console.error('Error al cargar clientes:', error);
        mostrarAlerta(`No se pudieron cargar los clientes: ${error.message}`, 'danger');
    }
}

// Consultar detalles de un cliente por ID
async function abrirModalCliente(id) {
    try {
        const resultado = await apiFetch(API_ENDPOINTS.CUSTOMER_BY_ID(id));
        if (!resultado.ok) return;

        const cliente = resultado.data;
        document.getElementById('detalleClienteId').textContent = cliente.customerId || id;
        document.getElementById('detalleClienteEmpresa').textContent = cliente.companyName || 'No especificada';
        document.getElementById('detalleClienteContacto').textContent = cliente.contactName || 'No especificado';

        modalClienteInstance.show();
    } catch (error) {
        console.error('Error al consultar cliente:', error);
        mostrarAlerta(`Error al obtener información del cliente: ${error.message}`, 'danger');
    }
}

// Inicializar módulo de clientes
function inicializarClientes() {
    if (modalClienteElement) {
        modalClienteInstance = new bootstrap.Modal(modalClienteElement);
    }

    const btnRecargar = document.getElementById('btnRecargarClientes');
    if (btnRecargar) {
        btnRecargar.addEventListener('click', cargarClientes);
    }
}
