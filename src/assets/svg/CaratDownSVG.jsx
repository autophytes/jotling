import React from 'react';

const CaratDownSVG = (props) => {
	return (
		<svg x='0px' y='0px' viewBox='0 0 306 306' style={{ enableBackground: 'new 0 0 306 306' }}>
			<polygon
				transform={`rotate(${props.rotate ? props.rotate : 0} 153 153)`}
				points='270.3,58.65 153,175.95 35.7,58.65 0,94.35 153,247.35 306,94.35'
			/>
		</svg>
	);
};

export default CaratDownSVG;
