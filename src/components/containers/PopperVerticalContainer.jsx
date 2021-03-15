import React, { useEffect, useRef } from 'react';
import { usePopper } from 'react-popper';

const PopperVerticalContainer = ({
	referenceElement,
	closeFn,
	children,
	leftOffset = 50,
	rightOffset = 50,
	shouldUpdatePopper,
	setShouldUpdatePopper,
}) => {
	// REFS
	const popperElementRef = useRef(null);
	const closeFnRef = useRef(closeFn);

	// POPPER
	const { styles, attributes, forceUpdate } = usePopper(
		referenceElement,
		popperElementRef.current,
		{
			placement: 'right',
			modifiers: [
				// { name: 'arrow', options: { element: arrowElement.current } },
				{
					name: 'offset',
					options: {
						offset: [0, 10],
					},
				},
				{ name: 'flip', options: { rootBoundary: 'viewport', fallbackPlacements: ['right'] } },
				{
					name: 'preventOverflow',
					options: {
						enabled: true,
						altAxis: true,
						padding: { left: leftOffset, right: rightOffset, top: 100, bottom: 20 }, // TOP OFFSET needs to be the top nav and editor nav
					},
				},
			],
		}
	);

	// Update the closeFnRef so the event handlers get the current function
	useEffect(() => {
		closeFnRef.current = closeFn;
	}, [closeFn]);

	useEffect(() => {
		if (shouldUpdatePopper) {
			console.log('updating the popper positioning');
			if (forceUpdate) {
				setShouldUpdatePopper(false);
				forceUpdate();
			}
		}
	}, [shouldUpdatePopper, forceUpdate]);

	// NEED TO UPDATE - close function
	// Closes the popper if clicking outside the popper or hitting escape
	useEffect(() => {
		const handleEscapePopper = (e) => {
			if (e.keyCode === 27) {
				e.stopPropagation();
				console.log('escape key - closing popper');
				closeFnRef.current();
			}
		};

		const handleExternalClickPopper = (e) => {
			if (popperElementRef.current && !popperElementRef.current.contains(e.target)) {
				e.stopPropagation();
				console.log('external click - closing popper');
				closeFnRef.current();
			}
		};

		document.addEventListener('click', handleExternalClickPopper);
		document.addEventListener('keyup', handleEscapePopper);

		return () => {
			document.removeEventListener('click', handleExternalClickPopper);
			document.removeEventListener('keyup', handleEscapePopper);
		};
	}, []);

	return (
		<div
			ref={popperElementRef}
			style={styles.popper}
			{...attributes.popper}
			id='link-popper-element'>
			<div className='link-popper add-to-wiki'>
				{/* PASS THROUGH CHILDREN */}
				{children}
			</div>
		</div>
	);
};

export default PopperVerticalContainer;
