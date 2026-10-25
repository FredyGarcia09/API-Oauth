let tablaProductos = null;
let modalProductoInstance = null;
let modalEliminarInstance = null;

const formProducto = document.querySelector('#frmProducto');
const modalProductoElement = document.getElementById('modalProducto');
const modalEliminarElement = document.getElementById('modalEliminar');

// Mostrar alertas amigables en la interfaz
function mostrarAlerta(mensaje, tipo = 'success') {
    const contenedor = document.getElementById('contenedorAlertas');
    if (!contenedor) return;

    contenedor.innerHTML = `
        <div class="alert alert-${tipo} alert-dismissible fade show shadow-sm" role="alert">
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    setTimeout(() => {
        const alerta = contenedor.querySelector('.alert');
        if (alerta) {
            const bsAlert = bootstrap.Alert.getOrCreateInstance(alerta);
            bsAlert.close();
        }
    }, 5000);
}

// Sanitizar texto para usar seguro en atributos HTML
function escapeHtml(texto) {
    if (!texto) return '';
    return String(texto)
        .replace(/&/g, '&amp;')
        .replace(/'/g, '&#39;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// Obtener la lista de categorías para el selector
async function cargarCategorias() {
    try {
        const respuesta = await fetch(`${API_BASE_URL}/api/Categories`, {
            credentials: 'include'
        });

        if (respuesta.status === 401 || respuesta.status === 403) {
            window.location.href = 'login.html';
            return;
        }

        if (!respuesta.ok) {
            throw new Error(`HTTP ${respuesta.status}`);
        }

        const categorias = await respuesta.json();
        const selectCategoria = document.getElementById('CategoryId');
        selectCategoria.innerHTML = '<option value="" selected>Selecciona una categoría...</option>';

        categorias.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.categoryId;
            option.textContent = cat.categoryName;
            selectCategoria.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar las categorías:', error);
    }
}

// Obtener la lista de proveedores para el selector
async function cargarProveedores() {
    try {
        const respuesta = await fetch(`${API_BASE_URL}/api/Suppliers`, {
            credentials: 'include'
        });

        if (respuesta.status === 401 || respuesta.status === 403) {
            window.location.href = 'login.html';
            return;
        }

        if (!respuesta.ok) {
            throw new Error(`HTTP ${respuesta.status}`);
        }

        const proveedores = await respuesta.json();
        const selectProveedor = document.getElementById('SupplierId');
        selectProveedor.innerHTML = '<option value="" selected>Selecciona un proveedor...</option>';

        proveedores.forEach(prov => {
            const option = document.createElement('option');
            option.value = prov.supplierId;
            option.textContent = prov.companyName;
            selectProveedor.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar los proveedores:', error);
    }
}

// Obtener y renderizar la lista completa de productos en DataTable
async function cargarProductos() {
    try {
        const respuesta = await fetch(`${API_BASE_URL}/api/Products`, {
            credentials: 'include'
        });

        if (respuesta.status === 401 || respuesta.status === 403) {
            window.location.href = 'login.html';
            return;
        }

        if (!respuesta.ok) {
            throw new Error(`HTTP ${respuesta.status}`);
        }

        const data = await respuesta.json();

        if (tablaProductos) {
            tablaProductos.clear();
            tablaProductos.rows.add(data);
            tablaProductos.draw();
        } else {
            tablaProductos = new DataTable('#listaProductos', {
                data: data,
                language: {
                    search: "Buscar:",
                    lengthMenu: "Mostrar _MENU_ productos",
                    info: "Mostrando _START_ a _END_ de _TOTAL_ productos",
                    infoEmpty: "No hay productos disponibles",
                    infoFiltered: "(filtrado de _MAX_ registros totales)",
                    zeroRecords: "No se encontraron productos coincidentes",
                    paginate: {
                        first: "Primero",
                        last: "Último",
                        next: "Siguiente",
                        previous: "Anterior"
                    }
                },
                columns: [
                    { title: 'ID', data: 'productId', width: '5%' },
                    { title: 'Producto', data: 'productName' },
                    { title: 'Proveedor', data: 'supplier' },
                    { title: 'Categoría', data: 'category' },
                    {
                        title: 'Precio',
                        data: 'unitPrice',
                        render: function (data) {
                            return data != null ? `$${parseFloat(data).toFixed(2)}` : '$0.00';
                        }
                    },
                    {
                        title: 'Existencia',
                        data: 'unitsInStock',
                        render: function (data) {
                            return data ?? 0;
                        }
                    },
                    {
                        title: 'Estado',
                        data: 'discontinued',
                        render: function (data) {
                            return data
                                ? '<span class="badge bg-secondary">Descontinuado</span>'
                                : '<span class="badge bg-success">Activo</span>';
                        }
                    },
                    {
                        title: 'Acciones',
                        data: null,
                        orderable: false,
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
        mostrarAlerta('No se pudieron cargar los productos.', 'danger');
    }
}

// Preparar y abrir el modal para un nuevo producto
function abrirModalNuevo() {
    formProducto.reset();
    formProducto.classList.remove('was-validated');
    document.getElementById('ProductId').value = '';
    document.getElementById('SupplierId').value = '';
    document.getElementById('CategoryId').value = '';
    document.getElementById('Discontinued').checked = false;
    document.getElementById('modalProductoTitulo').textContent = 'Registrar Producto';
    modalProductoInstance.show();
}

// Obtener datos del producto por ID y abrir el modal en modo edición
async function abrirModalEditar(id) {
    try {
        const respuesta = await fetch(`${API_BASE_URL}/api/Products/${id}`, {
            credentials: 'include'
        });

        if (respuesta.status === 401 || respuesta.status === 403) {
            window.location.href = 'login.html';
            return;
        }

        if (!respuesta.ok) {
            mostrarAlerta('No se encontró el producto a editar.', 'danger');
            return;
        }

        const producto = await respuesta.json();

        formProducto.reset();
        formProducto.classList.remove('was-validated');

        document.getElementById('ProductId').value = producto.productId;
        document.getElementById('ProductName').value = producto.productName ?? '';
        document.getElementById('SupplierId').value = producto.supplierId ?? '';
        document.getElementById('CategoryId').value = producto.categoryId ?? '';
        document.getElementById('QuantityPerUnit').value = producto.quantityPerUnit ?? '';
        document.getElementById('UnitPrice').value = producto.unitPrice ?? '';
        document.getElementById('UnitsInStock').value = producto.unitsInStock ?? '';
        document.getElementById('UnitsOnOrder').value = producto.unitsOnOrder ?? '';
        document.getElementById('ReorderLevel').value = producto.reorderLevel ?? '';
        document.getElementById('Discontinued').checked = Boolean(producto.discontinued);

        document.getElementById('modalProductoTitulo').textContent = 'Editar Producto';
        modalProductoInstance.show();
    } catch (error) {
        console.error('Error al obtener el producto:', error);
        mostrarAlerta('Error al cargar la información del producto.', 'danger');
    }
}

// Manejar el guardado (POST para nuevo, PUT para actualizar)
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

        // Estructura de datos respetando tipos de la API
        const datosProducto = {
            productName: document.getElementById('ProductName').value.trim(),
            supplierId: document.getElementById('SupplierId').value ? parseInt(document.getElementById('SupplierId').value, 10) : null,
            categoryId: document.getElementById('CategoryId').value ? parseInt(document.getElementById('CategoryId').value, 10) : null,
            quantityPerUnit: document.getElementById('QuantityPerUnit').value.trim() || null,
            unitPrice: document.getElementById('UnitPrice').value !== '' ? parseFloat(document.getElementById('UnitPrice').value) : null,
            unitsInStock: document.getElementById('UnitsInStock').value !== '' ? parseInt(document.getElementById('UnitsInStock').value, 10) : null,
            unitsOnOrder: document.getElementById('UnitsOnOrder').value !== '' ? parseInt(document.getElementById('UnitsOnOrder').value, 10) : null,
            reorderLevel: document.getElementById('ReorderLevel').value !== '' ? parseInt(document.getElementById('ReorderLevel').value, 10) : null,
            discontinued: document.getElementById('Discontinued').checked
        };

        const url = esEdicion
            ? `${API_BASE_URL}/api/Products/${idValor}`
            : `${API_BASE_URL}/api/Products`;

        if (esEdicion) {
            datosProducto.productId = parseInt(idValor, 10);
        }

        try {
            const respuesta = await fetch(url, {
                method: esEdicion ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(datosProducto)
            });

            if (respuesta.status === 401 || respuesta.status === 403) {
                window.location.href = 'login.html';
                return;
            }

            if (respuesta.ok) {
                modalProductoInstance.hide();
                mostrarAlerta(esEdicion ? 'Producto actualizado exitosamente.' : 'Producto registrado exitosamente.', 'success');
                cargarProductos();
            } else {
                mostrarAlerta('Ocurrió un error al procesar la solicitud.', 'danger');
            }
        } catch (error) {
            console.error('Error al guardar el producto:', error);
            mostrarAlerta('Error de conexión con el servidor.', 'danger');
        }
    });
}

// Limpiar formulario y restablecer validaciones
const btnLimpiar = document.getElementById('btnLimpiar');
if (btnLimpiar) {
    btnLimpiar.addEventListener('click', () => {
        const idActual = document.getElementById('ProductId').value;
        formProducto.reset();
        formProducto.classList.remove('was-validated');
        document.getElementById('ProductId').value = idActual;
        document.getElementById('SupplierId').value = '';
        document.getElementById('CategoryId').value = '';
        document.getElementById('Discontinued').checked = false;
    });
}

// Abrir modal de confirmación de eliminación
function abrirModalEliminar(id, nombre) {
    document.getElementById('eliminarProductId').value = id;
    document.getElementById('eliminarProductName').textContent = nombre;
    modalEliminarInstance.show();
}

// Ejecutar eliminación llamando a DELETE api/Products/{id}
const btnConfirmarEliminar = document.getElementById('btnConfirmarEliminar');
if (btnConfirmarEliminar) {
    btnConfirmarEliminar.addEventListener('click', async () => {
        const id = document.getElementById('eliminarProductId').value;
        if (!id) return;

        try {
            const respuesta = await fetch(`${API_BASE_URL}/api/Products/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            modalEliminarInstance.hide();

            if (respuesta.status === 401 || respuesta.status === 403) {
                window.location.href = 'login.html';
                return;
            }

            if (respuesta.ok) {
                mostrarAlerta('Producto eliminado correctamente.', 'success');
                cargarProductos();
            } else if (respuesta.status === 400) {
                // Manejo del mensaje de pedidos asociados de la API
                const errorData = await respuesta.json();
                mostrarAlerta(errorData.message || 'No se puede eliminar el producto.', 'warning');
            } else {
                mostrarAlerta('Error al eliminar el producto.', 'danger');
            }
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            mostrarAlerta('Error de conexión al eliminar el producto.', 'danger');
        }
    });
}

// Inicializar vistas y eventos
document.addEventListener('DOMContentLoaded', async () => {
    modalProductoInstance = new bootstrap.Modal(modalProductoElement);
    modalEliminarInstance = new bootstrap.Modal(modalEliminarElement);

    const btnNuevo = document.getElementById('btnNuevoProducto');
    if (btnNuevo) {
        btnNuevo.addEventListener('click', abrirModalNuevo);
    }

    inicializarLogout();

    // Validar sesión antes de cargar información
    const sesionValida = await verificarSesion();
    if (sesionValida) {
        cargarNombreUsuario();
        cargarProveedores();
        cargarCategorias();
        cargarProductos();
    }
});
