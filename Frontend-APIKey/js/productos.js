/**
 * productos.js - Gestión del catálogo de productos
 */

let tablaProductos = null;
let modalProductoInstance = null;
let modalEliminarInstance = null;

const formProducto = document.getElementById('frmProducto');
const modalProductoElement = document.getElementById('modalProducto');
const modalEliminarElement = document.getElementById('modalEliminar');

// Cargar el listado y conteo de productos
async function cargarProductos() {
    try {
        const resultado = await apiFetch(API_ENDPOINTS.PRODUCTS);

        if (!resultado.ok) return;

        const data = resultado.data || {};
        const productos = Array.isArray(data.products) ? data.products : (Array.isArray(data) ? data : []);
        const total = data.totalProducts !== undefined ? data.totalProducts : productos.length;

        const totalEl = document.getElementById('totalProductosCount');
        if (totalEl) {
            totalEl.textContent = `${total} productos`;
        }

        if (tablaProductos) {
            tablaProductos.clear();
            tablaProductos.rows.add(productos);
            tablaProductos.draw();
        } else {
            tablaProductos = new DataTable('#listaProductos', {
                data: productos,
                responsive: true,
                language: {
                    search: "Buscar:",
                    lengthMenu: "Mostrar _MENU_ productos",
                    info: "Mostrando _START_ a _END_ de _TOTAL_ productos",
                    infoEmpty: "No hay productos disponibles",
                    infoFiltered: "(filtrado de _MAX_ totales)",
                    zeroRecords: "No se encontraron productos coincidentes",
                    paginate: {
                        first: "Primero",
                        last: "Último",
                        next: "Siguiente",
                        previous: "Anterior"
                    }
                },
                columns: [
                    { title: 'ID', data: 'productId', width: '8%', className: 'text-center fw-bold text-secondary' },
                    { 
                        title: 'Producto', 
                        data: 'productName',
                        render: (data) => `<span class="fw-semibold text-dark">${escapeHtml(data)}</span>`
                    },
                    {
                        title: 'Precio',
                        data: 'unitPrice',
                        className: 'text-end',
                        render: function (data) {
                            return data !== null && data !== undefined
                                ? `$${parseFloat(data).toFixed(2)}`
                                : '$0.00';
                        }
                    },
                    {
                        title: 'Existencia',
                        data: 'unitsInStock',
                        className: 'text-center',
                        render: function (data) {
                            return data ?? 0;
                        }
                    },
                    {
                        title: 'Acciones',
                        data: null,
                        orderable: false,
                        className: 'text-center',
                        width: '14%',
                        render: function (data, type, row) {
                            return `
                                <div class="btn-group btn-group-sm" role="group">
                                    <button type="button" class="btn btn-outline-primary" onclick="abrirModalEditar(${row.productId})" title="Editar">
                                        <i class="bi bi-pencil-square"></i>
                                    </button>
                                    <button type="button" class="btn btn-outline-danger" onclick="abrirModalEliminar(${row.productId}, '${escapeHtml(row.productName)}')" title="Eliminar">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            `;
                        }
                    }
                ]
            });
        }
    } catch (error) {
        console.error('Error al cargar productos:', error);
        mostrarAlerta(`No se pudieron cargar los productos: ${error.message}`, 'danger');
    }
}

// Abrir modal para nuevo producto
function abrirModalNuevo() {
    if (!formProducto) return;
    formProducto.reset();
    formProducto.classList.remove('was-validated');
    document.getElementById('ProductId').value = '';
    document.getElementById('Discontinued').checked = false;
    document.getElementById('modalProductoTitulo').textContent = 'Registrar Producto';
    modalProductoInstance.show();
}

// Obtener producto por ID y abrir modal para edición
async function abrirModalEditar(id) {
    try {
        const res = await apiFetch(API_ENDPOINTS.PRODUCT_BY_ID(id));
        if (!res.ok) return;

        const producto = res.data;
        formProducto.reset();
        formProducto.classList.remove('was-validated');

        document.getElementById('ProductId').value = producto.productId;
        document.getElementById('ProductName').value = producto.productName ?? '';
        document.getElementById('UnitPrice').value = producto.unitPrice !== null ? producto.unitPrice : '';
        document.getElementById('UnitsInStock').value = producto.unitsInStock !== null ? producto.unitsInStock : '';
        document.getElementById('Discontinued').checked = Boolean(producto.discontinued);

        document.getElementById('modalProductoTitulo').textContent = 'Editar Producto';
        modalProductoInstance.show();
    } catch (error) {
        console.error('Error al consultar producto:', error);
        mostrarAlerta(`Error al obtener información del producto: ${error.message}`, 'danger');
    }
}

// Escuchar envío del formulario (POST o PUT)
if (formProducto) {
    formProducto.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!formProducto.checkValidity()) {
            event.stopPropagation();
            formProducto.classList.add('was-validated');
            return;
        }

        const idValor = document.getElementById('ProductId').value;
        const esEdicion = Boolean(idValor);

        const productName = document.getElementById('ProductName').value.trim();
        const unitPriceVal = document.getElementById('UnitPrice').value;
        const unitsInStockVal = document.getElementById('UnitsInStock').value;
        const discontinued = document.getElementById('Discontinued').checked;

        const payload = {
            productName: productName,
            unitPrice: unitPriceVal !== '' ? parseFloat(unitPriceVal) : null,
            unitsInStock: unitsInStockVal !== '' ? parseInt(unitsInStockVal, 10) : null,
            discontinued: discontinued
        };

        const url = esEdicion
            ? API_ENDPOINTS.PRODUCT_BY_ID(idValor)
            : API_ENDPOINTS.PRODUCTS;

        const metodo = esEdicion ? 'PUT' : 'POST';

        const btnGuardar = document.getElementById('btnGuardar');
        if (btnGuardar) btnGuardar.disabled = true;

        try {
            await apiFetch(url, {
                method: metodo,
                body: JSON.stringify(payload)
            });

            modalProductoInstance.hide();
            mostrarAlerta(
                esEdicion ? 'Producto actualizado exitosamente.' : 'Producto registrado exitosamente.',
                'success'
            );
            cargarProductos();
        } catch (error) {
            console.error('Error al guardar producto:', error);
            mostrarAlerta(`Error al guardar: ${error.message}`, 'danger');
        } finally {
            if (btnGuardar) btnGuardar.disabled = false;
        }
    });
}

// Boton Limpiar en el modal
const btnLimpiar = document.getElementById('btnLimpiar');
if (btnLimpiar) {
    btnLimpiar.addEventListener('click', () => {
        const idActual = document.getElementById('ProductId').value;
        formProducto.reset();
        formProducto.classList.remove('was-validated');
        document.getElementById('ProductId').value = idActual;
        document.getElementById('Discontinued').checked = false;
    });
}

// Abrir modal de confirmación de eliminacion
function abrirModalEliminar(id, nombre) {
    document.getElementById('eliminarProductId').value = id;
    document.getElementById('eliminarProductName').textContent = nombre;
    modalEliminarInstance.show();
}

// Confirmar eliminacion (DELETE /api/Products/{id})
const btnConfirmarEliminar = document.getElementById('btnConfirmarEliminar');
if (btnConfirmarEliminar) {
    btnConfirmarEliminar.addEventListener('click', async () => {
        const id = document.getElementById('eliminarProductId').value;
        if (!id) return;

        btnConfirmarEliminar.disabled = true;

        try {
            await apiFetch(API_ENDPOINTS.PRODUCT_BY_ID(id), {
                method: 'DELETE'
            });

            modalEliminarInstance.hide();
            mostrarAlerta('Producto eliminado correctamente.', 'success');
            cargarProductos();
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            modalEliminarInstance.hide();

            if (error.status === 409) {
                mostrarAlerta('No se puede eliminar el producto porque tiene pedidos asociados.', 'warning');
            } else {
                mostrarAlerta(`Error al eliminar: ${error.message}`, 'danger');
            }
        } finally {
            btnConfirmarEliminar.disabled = false;
        }
    });
}

// Inicializar instancias de modales y botones
function inicializarProductos() {
    if (modalProductoElement) {
        modalProductoInstance = new bootstrap.Modal(modalProductoElement);
    }
    if (modalEliminarElement) {
        modalEliminarInstance = new bootstrap.Modal(modalEliminarElement);
    }

    const btnNuevo = document.getElementById('btnNuevoProducto');
    if (btnNuevo) {
        btnNuevo.addEventListener('click', abrirModalNuevo);
    }

    const btnRecargar = document.getElementById('btnRecargarProductos');
    if (btnRecargar) {
        btnRecargar.addEventListener('click', cargarProductos);
    }
}
