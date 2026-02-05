// Report state management using reducer pattern

export const initialReportState = {
  reportId: null,
  datasetId: null,
  visuals: [],
  selectedVisualId: null
};

export const reportActions = {
  ADD_VISUAL: 'ADD_VISUAL',
  UPDATE_VISUAL: 'UPDATE_VISUAL',
  DELETE_VISUAL: 'DELETE_VISUAL',
  SELECT_VISUAL: 'SELECT_VISUAL',
  MOVE_VISUAL: 'MOVE_VISUAL',
  RESIZE_VISUAL: 'RESIZE_VISUAL',
  UPDATE_DATA_CONFIG: 'UPDATE_DATA_CONFIG',
  UPDATE_STYLE_CONFIG: 'UPDATE_STYLE_CONFIG',
  UPDATE_FILTERS: 'UPDATE_FILTERS',
  LOAD_REPORT: 'LOAD_REPORT'
};

export function reportReducer(state, action) {
  switch (action.type) {
    case reportActions.ADD_VISUAL:
      const newVisual = {
        id: `visual_${Date.now()}`,
        type: action.payload.type,
        position: { x: 50, y: 50, w: 400, h: 300 },
        dataConfig: {
          xAxis: null,
          yAxis: null,
          category: null,
          values: [],
          aggregation: 'sum',
          groupBy: null,
          filters: []
        },
        styleConfig: {
          title: `New ${action.payload.type.charAt(0).toUpperCase() + action.payload.type.slice(1)}`,
          colorScheme: 'default',
          showLegend: true,
          showGridlines: true,
          dataLabels: 'none',
          fontSize: 'large',
          color: '#3B82F6',
          legendPosition: 'top',
          chartOrientation: 'vertical',
          xAxisLabel: '',
          yAxisLabel: '',
          numberFormat: 'number'
        }
      };
      return {
        ...state,
        visuals: [...state.visuals, newVisual],
        selectedVisualId: newVisual.id
      };

    case reportActions.UPDATE_VISUAL:
      return {
        ...state,
        visuals: state.visuals.map(v =>
          v.id === action.payload.id ? { ...v, ...action.payload.updates } : v
        )
      };

    case reportActions.DELETE_VISUAL:
      return {
        ...state,
        visuals: state.visuals.filter(v => v.id !== action.payload.id),
        selectedVisualId: state.selectedVisualId === action.payload.id ? null : state.selectedVisualId
      };

    case reportActions.SELECT_VISUAL:
      return {
        ...state,
        selectedVisualId: action.payload.id
      };

    case reportActions.MOVE_VISUAL:
      return {
        ...state,
        visuals: state.visuals.map(v =>
          v.id === action.payload.id
            ? { ...v, position: { ...v.position, x: action.payload.x, y: action.payload.y } }
            : v
        )
      };

    case reportActions.RESIZE_VISUAL:
      return {
        ...state,
        visuals: state.visuals.map(v =>
          v.id === action.payload.id
            ? { ...v, position: { ...v.position, w: action.payload.w, h: action.payload.h } }
            : v
        )
      };

    case reportActions.UPDATE_DATA_CONFIG:
      return {
        ...state,
        visuals: state.visuals.map(v =>
          v.id === action.payload.id
            ? { ...v, dataConfig: { ...v.dataConfig, ...action.payload.config } }
            : v
        )
      };

    case reportActions.UPDATE_STYLE_CONFIG:
      return {
        ...state,
        visuals: state.visuals.map(v =>
          v.id === action.payload.id
            ? { ...v, styleConfig: { ...v.styleConfig, ...action.payload.config } }
            : v
        )
      };

    case reportActions.LOAD_REPORT:
      return {
        ...state,
        ...action.payload
      };

    default:
      return state;
  }
}
