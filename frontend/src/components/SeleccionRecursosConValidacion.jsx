import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button } from '@/components/ui';
import { disponibilidadService } from '@/services/api';

/*
  Componente:
  SeleccionRecursosConValidacion

  Permite:
  - Cargar recursos disponibles
  - Filtrar y buscar recursos
  - Seleccionar múltiples recursos
  - Validar disponibilidad total
  - Calcular costos
*/
const SeleccionRecursosConValidacion = ({
  onRecursosSeleccionados,
  fechaInicio,
  duracionHoras
}) => {

  // ======================= ESTADOS =======================

  // Lista de recursos con disponibilidad
  const [recursos, setRecursos] = useState([]);

  // Filtros
  const [search, setSearch] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');

  // Tipos de recursos
  const [tipos, setTipos] = useState([]);
  const [tipoNombreMap, setTipoNombreMap] = useState({});

  // Recursos más usados (localStorage)
  const [frecuentes, setFrecuentes] = useState({});

  // Recursos seleccionados
  const [recursosSeleccionados, setRecursosSeleccionados] = useState([]);

  // Estados de carga y validación
  const [cargando, setCargando] = useState(false);
  const [validacionGlobal, setValidacionGlobal] = useState({
    valida: false,
    mensaje: ''
  });

  // ======================= EFECTOS =======================

  // Cargar recursos cuando cambia fecha o duración
  useEffect(() => {
    if (fechaInicio) cargarRecursosConDisponibilidad();
  }, [fechaInicio, duracionHoras]);

  // Validar automáticamente cuando cambia la selección
  useEffect(() => {
    if (recursosSeleccionados.length > 0 && fechaInicio && duracionHoras) {
      validarSeleccionCompleta();
    }
  }, [recursosSeleccionados, fechaInicio, duracionHoras]);

  // ======================= FUNCIONES =======================

  // Carga recursos + disponibilidad desde backend
  const cargarRecursosConDisponibilidad = async () => {
    setCargando(true);
    try {
      // Cargar tipos de recursos
      try {
        const resp = await fetch('/api/tipos-recursos');
        const tiposData = await resp.json();
        const lista = Array.isArray(tiposData) ? tiposData : [];
        setTipos(lista);

        // Mapear ID → Nombre
        const map = {};
        lista.forEach(t => {
          if (t.idTipo) map[t.idTipo] = t.nombre;
        });
        setTipoNombreMap(map);
      } catch {}

      // Obtener recursos con detalle de disponibilidad
      const data = await disponibilidadService.obtenerRecursosDetalle(
        fechaInicio,
        duracionHoras || 1
      );

      setRecursos(data.detalle || []);
    } catch (error) {
      console.error('Error cargando recursos:', error);
      setRecursos([]);
    } finally {
      setCargando(false);
    }
  };

  // Valida si TODOS los recursos seleccionados están disponibles
  const validarSeleccionCompleta = async () => {
    if (recursosSeleccionados.length === 0) {
      setValidacionGlobal({
        valida: false,
        mensaje: 'No hay recursos seleccionados'
      });
      return;
    }

    try {
      const idsSeleccionados = recursosSeleccionados.map(r => r.idRecurso);

      const resultado = await disponibilidadService.verificarMultiple(
        idsSeleccionados,
        fechaInicio,
        duracionHoras
      );

      setValidacionGlobal({
        valida: resultado.todosDisponibles,
        mensaje: resultado.todosDisponibles
          ? 'Todos los recursos están disponibles'
          : 'Algunos recursos no están disponibles'
      });

      // Enviar resultado al componente padre
      onRecursosSeleccionados?.({
        recursos: recursosSeleccionados,
        valida: resultado.todosDisponibles,
        detalles: resultado
      });

    } catch (error) {
      console.error('Error validando selección:', error);
      setValidacionGlobal({
        valida: false,
        mensaje: 'Error validando disponibilidad'
      });
    }
  };

  // Seleccionar / deseleccionar un recurso
  const toggleRecurso = (recurso) => {

    // Guardar frecuencia en localStorage
    try {
      const key = 'frecuentes_recursos';
      const current = JSON.parse(localStorage.getItem(key) || '{}');

      if (!recursosSeleccionados.some(r => r.idRecurso === recurso.idRecurso)) {
        current[recurso.idRecurso] = (current[recurso.idRecurso] || 0) + 1;
        localStorage.setItem(key, JSON.stringify(current));
        setFrecuentes(current);
      }
    } catch {}

    // Alternar selección
    setRecursosSeleccionados(prev => {
      const ya = prev.find(r => r.idRecurso === recurso.idRecurso);
      if (ya) return prev.filter(r => r.idRecurso !== recurso.idRecurso);
      return [...prev, { ...recurso, horasSolicitadas: 1 }];
    });
  };

  // Calcular costo total
  const calcularCostoTotal = () =>
    recursosSeleccionados.reduce((total, r) => {
      const horas = parseInt(r.horasSolicitadas, 10)
        || parseInt(duracionHoras, 10)
        || 1;

      return total + parseFloat(r.tarifaHora) * horas;
    }, 0);

  // ======================= FILTROS =======================

  // Tipos y estados disponibles
  const tiposDisponibles = Array.from(
    new Set(recursos.map(x => x.recurso?.idTipo).filter(Boolean))
  );

  const estadosDisponibles = Array.from(
    new Set(
      recursos.map(x => x.estadoDisponibilidad).filter(Boolean)
    )
  );

  // Recursos filtrados por búsqueda, tipo y estado
  const recursosFiltrados = recursos.filter(x => {
    const r = x.recurso || {};

    const matchSearch = [r.nombre, r.descripcion, r.ubicacion]
      .filter(Boolean)
      .some(t => t.toLowerCase().includes(search.toLowerCase()));

    const matchTipo = tipoFiltro ? r.idTipo === tipoFiltro : true;
    const matchEstado = estadoFiltro
      ? x.estadoDisponibilidad === estadoFiltro
      : true;

    return matchSearch && matchTipo && matchEstado;
  });

  // ======================= RENDER =======================

  if (cargando) {
    return (
      <Card className="p-6 flex justify-center items-center">
        <div className="animate-spin h-8 w-8 border-b-2 border-blue-600" />
        <span className="ml-3">Cargando recursos...</span>
      </Card>
    );
  }

  return (
    <div className="space-y-4">

      {/* VALIDACIÓN GLOBAL */}
      {recursosSeleccionados.length > 0 && (
        <Card
          className={`p-4 border-2 ${
            validacionGlobal.valida
              ? 'border-green-200 bg-green-50'
              : 'border-red-200 bg-red-50'
          }`}
        >
          <strong>{validacionGlobal.mensaje}</strong>
        </Card>
      )}

      {/* LISTA DE RECURSOS */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          Seleccionar recursos *
        </h3>

        {recursosFiltrados.map(x => {
          const r = x.recurso;
          const seleccionado = recursosSeleccionados.some(
            s => s.idRecurso === r.idRecurso
          );

          return (
            <div
              key={r.idRecurso}
              onClick={() => toggleRecurso(r)}
              className={`p-4 border rounded cursor-pointer ${
                seleccionado ? 'bg-blue-50' : ''
              }`}
            >
              <h4 className="font-medium">{r.nombre}</h4>
              <p>S/. {r.tarifaHora} / hora</p>
            </div>
          );
        })}
      </Card>
    </div>
  );
};

export default SeleccionRecursosConValidacion;
