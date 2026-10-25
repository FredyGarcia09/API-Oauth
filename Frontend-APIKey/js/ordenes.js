/**
 * ordenes.js - Gestión y consulta de ordenes
 */

let tablaOrdenes = null;
let modalOrdenInstance = null;
const modalOrdenElement = document.getElementById('modalOrden');

// Cargar lista de ordenes
async function cargarOrdenes() {
    try {
        const resultado = await apiFetch(API_ENDPOINTS.ORDERS);
        if (!resultado.ok) return;

        const ordenes = Array.isArray(resultado.data) ? resultado.data : [];

        const totalEl = document.getElementById('totalOrdenesCount');
        if (totalEl) {
            totalEl.textContent = `${ordenes.length} órdenes`;
        }

        if (tablaOrdenes) {
            tablaOrdenes.clear();
            tablaOrdenes.rows.add(ordenes);
            tablaOrdenes.draw();
        } else {
            tablaOrdenes = new DataTable('#listaOrdenes', {
                data: ordenes,
                responsive: true,
                order: [[0, 'desc']],
                language: {
                    search: "Buscar:",
                    lengthMenu: "Mostrar _MENU_ órdenes",
                    info: "Mostrando _START_ a _END_ de _TOTAL_ órdenes",
                    infoEmpty: "No hay órdenes disponibles",
                    infoFiltered: "(filtrado de _MAX_ totales)",
                    zeroRecords: "No se encontraron órdenes coincidentes",
                    paginate: {
                        first: "Primero",
                        last: "Último",
                        next: "Siguiente",
                        previous: "Anterior"
                    }
                },
                columns: [
                    { 
                        title: 'N° Orden', 
                        data: 'orderId', 
                        width: '9%', 
                        className: 'text-center fw-bold text-dark' 
                    },
                    { 
                        title: 'Destinatario', 
                        data: 'shipName',
                        render: (data) => `<span class="fw-semibold">${escapeHtml(data || 'N/A')}</span>`
                    },
                    { 
                        title: 'Fecha de Pedido', 
                        data: 'orderDate',
                        render: (data) => formatearFecha(data)
                    },
                    { 
                        title: 'Estado', 
                        data: 'shippedDate',
                        render: function (data) {
                            if (data) {
                                return `<span class="badge bg-success-subtle text-success border border-success-subtle">Enviado</span>`;
                            }
                            return '<span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">Pendiente</span>';
                        }
                    },
                    { 
                        title: 'Flete', 
                        data: 'freight',
                        className: 'text-end',
                        render: (data) => data !== null && data !== undefined ? `$${parseFloat(data).toFixed(2)}` : '$0.00'
                    },
                    { 
                        title: 'Destino', 
                        data: null,
                        render: function (data, type, row) {
                            const partes = [row.shipCity, row.shipCountry].filter(Boolean);
                            return escapeHtml(partes.join(', ') || 'N/A');
                        }
                    },
                    {
                        title: 'Acciones',
                        data: null,
                        orderable: false,
                        className: 'text-center',
                        width: '10%',
                        render: function (data, type, row) {
                            return `
                                <button type="button" class="btn btn-sm btn-outline-secondary" onclick="abrirModalOrden(${row.orderId})">
                                    <i class="bi bi-eye me-1"></i> Ver
                                </button>
                            `;
                        }
                    }
                ]
            });
        }
    } catch (error) {
        console.error('Error al cargar órdenes:', error);
        mostrarAlerta(`No se pudieron cargar las órdenes: ${error.message}`, 'danger');
    }
}

// Consultar el detalle de una orden por ID
async function abrirModalOrden(id) {
    try {
        const resultado = await apiFetch(API_ENDPOINTS.ORDER_BY_ID(id));
        if (!resultado.ok) return;

        const orden = resultado.data;

        document.getElementById('detalleOrdenId').textContent = orden.orderId || id;
        document.getElementById('detalleOrdenDestinatario').textContent = orden.shipName || 'No especificado';
        document.getElementById('detalleOrdenDireccion').textContent = orden.shipAddress || 'No especificada';
        document.getElementById('detalleOrdenCiudad').textContent = orden.shipCity || 'No especificada';
        document.getElementById('detalleOrdenRegion').textContent = orden.shipRegion || 'N/A';
        document.getElementById('detalleOrdenCP').textContent = orden.shipPostalCode || 'N/A';
        document.getElementById('detalleOrdenPais').textContent = orden.shipCountry || 'No especificado';

        document.getElementById('detalleOrdenFechaPedido').textContent = formatearFecha(orden.orderDate);
        document.getElementById('detalleOrdenFechaRequerida').textContent = formatearFecha(orden.requiredDate);
        document.getElementById('detalleOrdenFechaEnvio').textContent = orden.shippedDate ? formatearFecha(orden.shippedDate) : 'Pendiente de envío';
        document.getElementById('detalleOrdenFlete').textContent = orden.freight !== null && orden.freight !== undefined ? `$${parseFloat(orden.freight).toFixed(2)}` : '$0.00';

        modalOrdenInstance.show();
    } catch (error) {
        console.error('Error al consultar orden:', error);
        mostrarAlerta(`Error al obtener información de la orden: ${error.message}`, 'danger');
    }
}

// Inicializar módulo de órdenes
function inicializarOrdenes() {
    if (modalOrdenElement) {
        modalOrdenInstance = new bootstrap.Modal(modalOrdenElement);
    }

    const btnRecargar = document.getElementById('btnRecargarOrdenes');
    if (btnRecargar) {
        btnRecargar.addEventListener('click', cargarOrdenes);
    }
}
