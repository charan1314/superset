/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
/* eslint-disable camelcase */
import {
  AnnotationLayer,
  CategoricalColorNamespace,
  DataRecordValue,
  DTTM_ALIAS,
  GenericDataType,
  getColumnLabel,
  getNumberFormatter,
  isEventAnnotationLayer,
  isFormulaAnnotationLayer,
  isIntervalAnnotationLayer,
  isTimeseriesAnnotationLayer,
  TimeseriesChartDataResponseResult,
  t,
} from '@superset-ui/core';
import { isDerivedSeries } from '@superset-ui/chart-controls';
import { EChartsCoreOption, SeriesOption } from 'echarts';
import { ZRLineType } from 'echarts/types/src/util/types';
import {
  EchartsTimeseriesChartProps,
  EchartsTimeseriesFormData,
  EchartsTimeseriesSeriesType,
  TimeseriesChartTransformedProps,
  OrientationType,
  AxisType,
} from './types';
import { DEFAULT_FORM_DATA } from './constants';
import { ForecastSeriesEnum, ForecastValue } from '../types';
import { parseYAxisBound } from '../utils/controls';
import {
  currentSeries,
  dedupSeries,
  extractSeries,
  getAxisType,
  getColtypesMapping,
  getLegendProps,
  extractDataTotalValues,
  extractShowValueIndexes,
} from '../utils/series';
import {
  extractAnnotationLabels,
  getAnnotationData,
} from '../utils/annotation';
import {
  extractForecastSeriesContext,
  extractForecastSeriesContexts,
  extractForecastValuesFromTooltipParams,
  formatForecastTooltipSeries,
  rebaseForecastDatum,
} from '../utils/forecast';
import { convertInteger } from '../utils/convertInteger';
import { defaultGrid, defaultTooltip, defaultYAxis } from '../defaults';
import {
  getPadding,
  getTooltipTimeFormatter,
  getXAxisFormatter,
  transformEventAnnotation,
  transformFormulaAnnotation,
  transformIntervalAnnotation,
  transformSeries,
  transformTimeseriesAnnotation,
} from './transformers';
import {
  AreaChartExtraControlsValue,
  TIMESERIES_CONSTANTS,
} from '../constants';
// @ts-ignore
import { translations } from '../../../../translations/traslation_servies';

export default function transformProps(
  chartProps: EchartsTimeseriesChartProps,
): TimeseriesChartTransformedProps {
  const {
    width,
    height,
    filterState,
    formData,
    hooks,
    queriesData,
    datasource,
    theme,
    inContextMenu,
  } = chartProps;
  const { verboseMap = {} } = datasource;
  const [queryData] = queriesData;
  const { data = [] } = queryData as TimeseriesChartDataResponseResult;
  const dataTypes = getColtypesMapping(queryData);
  const annotationData = getAnnotationData(chartProps);

  const {
    area,
    annotationLayers,
    colorScheme,
    contributionMode,
    forecastEnabled,
    legendOrientation,
    legendType,
    legendMargin,
    logAxis,
    markerEnabled,
    markerSize,
    opacity,
    minorSplitLine,
    seriesType,
    showLegend,
    stack,
    truncateYAxis,
    yAxisFormat,
    xAxisTimeFormat,
    yAxisBounds,
    tooltipTimeFormat,
    tooltipSortByMetric,
    zoomable,
    richTooltip,
    xAxis: xAxisOrig,
    xAxisLabelRotation,
    emitFilter,
    groupby,
    showValue,
    onlyTotal,
    percentageThreshold,
    xAxisTitle,
    yAxisTitle,
    xAxisTitleMargin,
    yAxisTitleMargin,
    yAxisTitlePosition,
    sliceId,
    orientation,
  }: EchartsTimeseriesFormData = { ...DEFAULT_FORM_DATA, ...formData };

  const colorScale = CategoricalColorNamespace.getScale(colorScheme as string);
  const rebasedData = rebaseForecastDatum(data, verboseMap);
  const xAxisCol =
    verboseMap[xAxisOrig] || getColumnLabel(xAxisOrig || DTTM_ALIAS);
  const isHorizontal = orientation === OrientationType.horizontal;
  const { totalStackedValues, thresholdValues } = extractDataTotalValues(
    rebasedData,
    {
      stack,
      percentageThreshold,
      xAxisCol,
    },
  );
  const rawSeries = extractSeries(rebasedData, {
    fillNeighborValue: stack && !forecastEnabled ? 0 : undefined,
    xAxis: xAxisCol,
    removeNulls: seriesType === EchartsTimeseriesSeriesType.Scatter,
    stack,
    totalStackedValues,
    isHorizontal,
  });
  // eslint-disable-next-line array-callback-return
  rawSeries.map(series => {
    // eslint-disable-next-line no-param-reassign
    series.name = translations(series.name);
    // eslint-disable-next-line no-param-reassign
    series.id = translations(series.id);
  });
  const showValueIndexes = extractShowValueIndexes(rawSeries, {
    stack,
  });
  const seriesContexts = extractForecastSeriesContexts(
    Object.values(rawSeries).map(series => series.name as string),
  );
  const isAreaExpand = stack === AreaChartExtraControlsValue.Expand;
  const xAxisDataType = dataTypes?.[xAxisCol] ?? dataTypes?.[xAxisOrig];

  const xAxisType = getAxisType(xAxisDataType);
  const series: SeriesOption[] = [];
  const formatter = getNumberFormatter(
    contributionMode || isAreaExpand ? ',.0%' : yAxisFormat,
  );

  rawSeries.forEach(entry => {
    const lineStyle = isDerivedSeries(entry, chartProps.rawFormData)
      ? { type: 'dashed' as ZRLineType }
      : {};
    const transformedSeries = transformSeries(entry, colorScale, {
      area,
      filterState,
      seriesContexts,
      markerEnabled,
      markerSize,
      areaOpacity: opacity,
      seriesType,
      stack,
      formatter,
      showValue,
      onlyTotal,
      totalStackedValues,
      showValueIndexes,
      thresholdValues,
      richTooltip,
      sliceId,
      isHorizontal,
      lineStyle,
    });
    if (transformedSeries) series.push(transformedSeries);
  });

  const selectedValues = (filterState.selectedValues || []).reduce(
    (acc: Record<string, number>, selectedValue: string) => {
      const index = series.findIndex(({ name }) => name === selectedValue);
      return {
        ...acc,
        [index]: selectedValue,
      };
    },
    {},
  );

  annotationLayers
    .filter((layer: AnnotationLayer) => layer.show)
    .forEach((layer: AnnotationLayer) => {
      if (isFormulaAnnotationLayer(layer))
        series.push(
          transformFormulaAnnotation(
            layer,
            data,
            xAxisCol,
            xAxisType,
            colorScale,
            sliceId,
          ),
        );
      else if (isIntervalAnnotationLayer(layer)) {
        series.push(
          ...transformIntervalAnnotation(
            layer,
            data,
            annotationData,
            colorScale,
            theme,
            sliceId,
          ),
        );
      } else if (isEventAnnotationLayer(layer)) {
        series.push(
          ...transformEventAnnotation(
            layer,
            data,
            annotationData,
            colorScale,
            theme,
            sliceId,
          ),
        );
      } else if (isTimeseriesAnnotationLayer(layer)) {
        series.push(
          ...transformTimeseriesAnnotation(
            layer,
            markerSize,
            data,
            annotationData,
            colorScale,
            sliceId,
          ),
        );
      }
    });

  // yAxisBounds need to be parsed to replace incompatible values with undefined
  let [min, max] = (yAxisBounds || []).map(parseYAxisBound);

  // default to 0-100% range when doing row-level contribution chart
  if ((contributionMode === 'row' || isAreaExpand) && stack) {
    if (min === undefined) min = 0;
    if (max === undefined) max = 1;
  }

  const tooltipFormatter =
    xAxisDataType === GenericDataType.TEMPORAL
      ? getTooltipTimeFormatter(tooltipTimeFormat)
      : String;
  const xAxisFormatter =
    xAxisDataType === GenericDataType.TEMPORAL
      ? getXAxisFormatter(xAxisTimeFormat)
      : String;

  const labelMap = series.reduce(
    (acc: Record<string, DataRecordValue[]>, datum) => {
      const name: string = datum.name as string;
      return {
        ...acc,
        [name]: [name],
      };
    },
    {},
  );

  const {
    setDataMask = () => {},
    setControlValue = (...args: unknown[]) => {},
    onContextMenu,
  } = hooks;

  const addYAxisLabelOffset = !!yAxisTitle;
  const addXAxisLabelOffset = !!xAxisTitle;
  const padding = getPadding(
    showLegend,
    legendOrientation,
    addYAxisLabelOffset,
    zoomable,
    legendMargin,
    addXAxisLabelOffset,
    yAxisTitlePosition,
    convertInteger(yAxisTitleMargin),
    convertInteger(xAxisTitleMargin),
  );

  const legendData = rawSeries
    .filter(
      entry =>
        extractForecastSeriesContext(entry.name || '').type ===
        ForecastSeriesEnum.Observation,
    )
    .map(entry => entry.name || '')
    .concat(extractAnnotationLabels(annotationLayers, annotationData));

  const markLineLabel: any = {
    show: true,
    position: 'start',
    formatter: '{b} {c}',
    lineHeight: 12,
    padding: [0, 0, 0, 4.4],
    distance: [0, -1],
    width: 30,
    // eslint-disable-next-line theme-colors/no-literal-colors
    color: '#8d8d8d',
    overflow: 'break',
  };

  const transperantMarkLine: any = {
    normal: {
      type: 'dashed',
      // eslint-disable-next-line theme-colors/no-literal-colors
      color: 'rgba(255,255,255,0)',
      cap: 'butt',
    },
  };

  const coloredMarkLine: any = {
    normal: {
      type: 'dashed',
      // eslint-disable-next-line theme-colors/no-literal-colors
      color: '#b2b2b2',
      cap: 'butt',
    },
  };

  const matchingArray = {};
  // eslint-disable-next-line array-callback-return
  series.map(row => {
    // eslint-disable-next-line array-callback-return
    series.map(cRow => {
      if (
        row.id !== cRow.id &&
        JSON.stringify(row.data) === JSON.stringify(cRow.data)
      ) {
        if (cRow.id === 'Option 1: Pathway 2DS - 2025') {
          matchingArray[cRow.id] = 0.99;
          // @ts-ignore
          // eslint-disable-next-line array-callback-return
          cRow.data.map(data => {
            // eslint-disable-next-line no-param-reassign
            data[1] *= 0.99;
          });
        } else {
          // @ts-ignore
          matchingArray[cRow.id] = 0.98;
          // @ts-ignore
          // eslint-disable-next-line array-callback-return
          cRow.data.map(data => {
            // eslint-disable-next-line no-param-reassign
            data[1] *= 0.98;
          });
        }
      }
    });
  });

  const tooltipValueFix = (key: string, value: number | undefined) => {
    if (matchingArray.hasOwnProperty(key)) {
      // @ts-ignore
      return value / matchingArray[key];
    }
    return value;
  };
  // eslint-disable-next-line array-callback-return
  series.map(row => {
    // eslint-disable-next-line no-param-reassign
    row.markLine = {
      symbol: ['none', 'none'],
      data: [
        {
          name: 'T',
          xAxis: '2020',
          label: markLineLabel,
          lineStyle: transperantMarkLine,
        },
        {
          name: 'T',
          xAxis: '2025',
          emphasis: {
            disabled: true,
          },
          label: markLineLabel,
          lineStyle: coloredMarkLine,
        },
        {
          name: 'T',
          xAxis: '2030',
          emphasis: {
            disabled: true,
          },
          label: markLineLabel,
          lineStyle: coloredMarkLine,
        },
        {
          name: 'T',
          xAxis: '2035',
          label: markLineLabel,
          lineStyle: transperantMarkLine,
        },
        {
          name: 'T',
          xAxis: '2040',
          label: markLineLabel,
          lineStyle: transperantMarkLine,
        },
        {
          name: 'T',
          xAxis: '2045',
          label: markLineLabel,
          lineStyle: transperantMarkLine,
        },
        {
          name: 'T',
          xAxis: '2050',
          label: markLineLabel,
          lineStyle: transperantMarkLine,
        },
      ],
    };
  });
  let xAxis: any = {
    type: xAxisType,
    name: translations(xAxisTitle),
    axisTick: { show: false },
    nameGap: convertInteger(xAxisTitleMargin),
    nameLocation: 'middle',
    axisLabel: {
      show: false,
      hideOverlap: true,
      formatter: xAxisFormatter,
      rotate: xAxisLabelRotation,
    },
  };

  if (xAxisType === AxisType.time) {
    /**
     * Overriding default behavior (false) for time axis regardless of the granilarity.
     * Not including this in the initial declaration above so if echarts changes the default
     * behavior for other axist types we won't unintentionally override it
     */
    xAxis.axisLabel.showMaxLabel = null;
  }

  let yAxis: any = {
    ...defaultYAxis,
    type: logAxis ? AxisType.log : AxisType.value,
    min,
    max,
    minorTick: { show: false },
    axisLine: { show: true },
    minorSplitLine: { show: minorSplitLine },
    axisLabel: { formatter },
    scale: truncateYAxis,
    name: translations(yAxisTitle),
    nameGap: convertInteger(yAxisTitleMargin),
    nameLocation: yAxisTitlePosition === 'Left' ? 'middle' : 'end',
  };

  if (isHorizontal) {
    [xAxis, yAxis] = [yAxis, xAxis];
    [padding.bottom, padding.left] = [padding.left, padding.bottom];
  }

  const echartOptions: EChartsCoreOption = {
    useUTC: true,
    grid: {
      ...defaultGrid,
      ...padding,
      bottom: 40,
    },
    xAxis,
    yAxis,
    tooltip: {
      show: !inContextMenu,
      ...defaultTooltip,
      appendToBody: true,
      trigger: richTooltip ? 'axis' : 'item',
      formatter: (params: any) => {
        const [xIndex, yIndex] = isHorizontal ? [1, 0] : [0, 1];
        const xValue: number = richTooltip
          ? params[0].value[xIndex]
          : params.value[xIndex];
        const forecastValue: any[] = richTooltip ? params : [params];

        if (richTooltip && tooltipSortByMetric) {
          forecastValue.sort((a, b) => b.data[yIndex] - a.data[yIndex]);
        }

        const rows: Array<string> = [`${tooltipFormatter(xValue)}`];
        const forecastValues: Record<string, ForecastValue> =
          extractForecastValuesFromTooltipParams(forecastValue, isHorizontal);

        Object.keys(forecastValues).forEach(key => {
          const value = forecastValues[key];
          value.observation = tooltipValueFix(key, value.observation);
          const content = formatForecastTooltipSeries({
            ...value,
            seriesName: key,
            formatter,
          });
          if (currentSeries.name === key) {
            rows.push(`<span style="font-weight: 700">${content}</span>`);
          } else {
            rows.push(`<span style="opacity: 0.7">${content}</span>`);
          }
        });
        return rows.join('<br />');
      },
    },
    legend: {
      ...getLegendProps(legendType, legendOrientation, showLegend, zoomable),
      data: legendData as string[],
    },
    series: dedupSeries(series),
    toolbox: {
      show: zoomable,
      top: TIMESERIES_CONSTANTS.toolboxTop,
      right: TIMESERIES_CONSTANTS.toolboxRight,
      feature: {
        dataZoom: {
          yAxisIndex: false,
          title: {
            zoom: t('zoom area'),
            back: t('restore zoom'),
          },
        },
      },
    },
    dataZoom: zoomable
      ? [
          {
            type: 'slider',
            start: TIMESERIES_CONSTANTS.dataZoomStart,
            end: TIMESERIES_CONSTANTS.dataZoomEnd,
            bottom: TIMESERIES_CONSTANTS.zoomBottom,
          },
        ]
      : [],
  };

  return {
    echartOptions,
    emitFilter,
    formData,
    groupby,
    height,
    labelMap,
    selectedValues,
    setDataMask,
    setControlValue,
    width,
    legendData,
    onContextMenu,
    xValueFormatter: tooltipFormatter,
  };
}
