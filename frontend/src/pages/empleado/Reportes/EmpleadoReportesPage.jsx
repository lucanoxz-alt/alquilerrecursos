// src/pages/empleado/Reportes/EmpleadoReportesPage.jsx
import React, { useEffect, useState } from 'react';
import api from '@/services/api';

const EmpleadoReportesPage = ({ user }) => {
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0,10));

  const cargarResumen = async (fechaParam) => {
    if (!user?.idUsuario) return;
    setLoading(true);
    try {
      const resp = await api.get('/reportes/diario-usuario', { params: { idUsuarioGestor: user.idUsuario, fecha: fechaParam } });
      setResumen(resp.data);
    } catch (err) {
      console.error('Error cargando resumen diario:', err);
      setResumen({ error: 'No se pudo cargar el resumen.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarResumen(fecha); }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold">Resumen diario (tu caja)</h2>
      <div className="mt-4">
        <label className="block text-sm mb-2">Fecha</label>
        <input type="date" value={fecha} onChange={(e)=> setFecha(e.target.value)} className="border p-2 rounded" />
        <button className="ml-3 bg-blue-600 text-white px-3 py-1 rounded" onClick={()=> cargarResumen(fecha)}>Cargar</button>
      </div>

      <div className="mt-6 bg-white p-4 rounded shadow">
        {loading && <div>Cargando...</div>}
        {!loading && resumen && resumen.error && <div className="text-red-600">{resumen.error}</div>}
        {!loading && resumen && !resumen.error && (
          <div>
            <p>Total pagos: <strong>{resumen.totalPagos}</strong></p>
            <p>Total monto: <strong>{resumen.totalMonto}</strong></p>
            <div className="mt-3">
              <h4 className="font-medium">Monto por método</h4>
              <ul className="list-disc pl-6">
                {Object.entries(resumen.montoPorMetodo || {}).map(([m, v]) => (
                  <li key={m}>{m}: {v}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmpleadoReportesPage;