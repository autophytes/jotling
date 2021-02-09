import React, { useEffect, useState } from 'react';

const LoadingOverlay = ({ isProjectLoaded }) => {
	const [disabled, setDisabled] = useState(false);

	// Disable the overlay after fading out
	useEffect(() => {
		if (isProjectLoaded) {
			setTimeout(() => {
				setDisabled(true);
			}, 1000);
		}
	}, [isProjectLoaded]);

	return disabled ? (
		<></>
	) : (
		<div className={'loadingOverlay' + (isProjectLoaded ? ' fadeOut' : '')}>
			<h1>Jotling</h1>
		</div>
	);
};

export default LoadingOverlay;
