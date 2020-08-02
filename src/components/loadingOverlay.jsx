import React, { useEffect, useState } from 'react';

const LoadingOverlay = ({ structureLoaded }) => {
	const [disabled, setDisabled] = useState(false);

	// Disable the overlay after fading out
	useEffect(() => {
		if (structureLoaded) {
			setTimeout(() => {
				setDisabled(true);
			}, 1000);
		}
	}, [structureLoaded]);

	return disabled ? (
		<></>
	) : (
		<div className={'loadingOverlay' + (structureLoaded ? ' fadeOut' : '')}>
			<h1>Jotling</h1>
		</div>
	);
};

export default LoadingOverlay;
