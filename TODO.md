# TODO: Refactor Gestionar Reservas Module

## Current Status
- ✅ Analyzed existing code structure
- ✅ Identified pattern from GestionarAlquileresPage.jsx
- ✅ Confirmed components to reuse

## Pending Tasks
- [ ] Refactor GestionarReservasPage.jsx to match GestionarAlquileresPage.jsx pattern
- [ ] Implement inline form with client search, date/time selection, resource selection
- [ ] Add TarjetaResumenReserva component integration
- [ ] Implement reservation creation logic with reservaService
- [ ] Add comprobante PDF generation after successful reservation
- [ ] Test complete reservation flow
- [ ] Remove old FormularioNuevaReserva.jsx component (if no longer needed)

## Components to Reuse
- BusquedaCliente
- FormularioNuevoCliente
- SeleccionRecursosConValidacion
- SeleccionMetodoPago
- TarjetaResumenReserva

## Key Differences from Alquileres
- Date/time selection is required before resource selection
- Uses SeleccionRecursosConValidacion instead of SeleccionRecursos
- Reservation creates comprobante for 50% payment
- Different service calls (reservaService vs alquiler API)
