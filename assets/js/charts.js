/* ========================================
   NeuroTrack Chart.js Visualization
   Recovery Trend Line Chart with Filters
   ======================================== */

let recoveryChart = null;
let chartData = null;

// Chart color configuration
const CHART_COLORS = {
  motor: {
    line: '#14b8a6', // Teal
    fill: 'rgba(20, 184, 166, 0.1)',
    point: '#14b8a6'
  },
  cognitive: {
    line: '#a855f7', // Purple
    fill: 'rgba(168, 85, 247, 0.1)',
    point: '#a855f7'
  }
};

// Chart configuration
const CHART_CONFIG = {
  type: 'line',
  options: {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            family: "'Inter', sans-serif",
            size: 13,
            weight: '600'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 13,
          family: "'Inter', sans-serif"
        },
        bodyFont: {
          size: 14,
          family: "'JetBrains Mono', monospace"
        },
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            label += context.parsed.y.toFixed(1);
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            family: "'Inter', sans-serif",
            size: 11
          },
          maxRotation: 45,
          minRotation: 0
        }
      },
      y: {
        min: 0,
        max: 100,
        grid: {
          color: '#e2e8f0',
          drawBorder: false
        },
        ticks: {
          font: {
            family: "'JetBrains Mono', monospace",
            size: 11
          },
          callback: function(value) {
            return value;
          }
        }
      }
    }
  }
};

/**
 * Initialize the recovery trend chart
 * @param {Object} data - Dashboard data from JSON
 */
function initializeChart(data) {
  chartData = data;
  const ctx = document.getElementById('recoveryTrendChart');
  
  if (!ctx) {
    console.error('Chart canvas element not found');
    return;
  }

  const config = {
    ...CHART_CONFIG,
    data: {
      labels: formatDateLabels(data.aggregated_trends.dates),
      datasets: [
        {
          label: 'Motor Function',
          data: data.aggregated_trends.avg_motor_function,
          borderColor: CHART_COLORS.motor.line,
          backgroundColor: CHART_COLORS.motor.fill,
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointBackgroundColor: CHART_COLORS.motor.point,
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        },
        {
          label: 'Cognitive Function',
          data: data.aggregated_trends.avg_cognitive_function,
          borderColor: CHART_COLORS.cognitive.line,
          backgroundColor: CHART_COLORS.cognitive.fill,
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointBackgroundColor: CHART_COLORS.cognitive.point,
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }
      ]
    }
  };

  recoveryChart = new Chart(ctx, config);
}

/**
 * Format date strings for chart labels
 * @param {Array<string>} dates - ISO date strings
 * @returns {Array<string>} Formatted date labels
 */
function formatDateLabels(dates) {
  return dates.map(dateStr => {
    const date = new Date(dateStr);
    const month = date.toLocaleString('en-US', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  });
}

/**
 * Update chart to show only specified datasets
 * @param {string} filter - 'all', 'motor', or 'cognitive'
 */
function updateChartFilter(filter) {
  if (!recoveryChart || !chartData) return;

  const motorDataset = recoveryChart.data.datasets[0];
  const cognitiveDataset = recoveryChart.data.datasets[1];

  switch(filter) {
    case 'motor':
      motorDataset.hidden = false;
      cognitiveDataset.hidden = true;
      break;
    case 'cognitive':
      motorDataset.hidden = true;
      cognitiveDataset.hidden = false;
      break;
    case 'all':
    default:
      motorDataset.hidden = false;
      cognitiveDataset.hidden = false;
      break;
  }

  recoveryChart.update('none'); // Update without animation for instant feedback
}

/**
 * Setup chart filter button event listeners
 */
function setupChartFilters() {
  const filterButtons = document.querySelectorAll('.chart-filter');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Update active state
      filterButtons.forEach(btn => btn.classList.remove('is-active'));
      button.classList.add('is-active');
      
      // Update chart
      const filter = button.getAttribute('data-filter');
      updateChartFilter(filter);
    });
  });
}

/**
 * Destroy existing chart instance
 */
function destroyChart() {
  if (recoveryChart) {
    recoveryChart.destroy();
    recoveryChart = null;
  }
}

// Export functions for use in app.js
if (typeof window !== 'undefined') {
  window.ChartModule = {
    initializeChart,
    updateChartFilter,
    setupChartFilters,
    destroyChart
  };
}
