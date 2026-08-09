import PieChartComponent from './PieChartComponent';
import BarChartComponent from './BarChartComponent';
import LineChartComponent from './LineChartComponent';

export {
    PieChartComponent,
    BarChartComponent,
    LineChartComponent
};

const Charts = ({ type, data }) => {
    switch (type) {
        case 'pie':
            return <PieChartComponent data={data} />;
        case 'bar':
            return <BarChartComponent data={data} />;
        case 'line':
            return <LineChartComponent data={data} />;
        default:
            return <div>Select a chart type</div>;
    }
};

export default Charts;
