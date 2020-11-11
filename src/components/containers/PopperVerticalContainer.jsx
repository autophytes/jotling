import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { usePopper } from 'react-popper';

const AddLinkPopper = ({
	referenceElement,
	closeFn,
	children,
	leftOffset = 20,
	rightOffset = 20,
	isContentRendered = true,
}) => {
	// REFS
	const popperElement = useRef(null);
	const arrowElement = useRef(null);

	// STATE
	const [minWidth, setMinWidth] = useState(0);

	// POPPER
	const { styles, attributes } = usePopper(referenceElement, popperElement.current, {
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
	});

	// NEED TO UPDATE - close function
	// Closes the popper if clicking outside the popper or hitting escape
	useEffect(() => {
		const handleEscapePopper = (e) => {
			console.log('click or keypress triggered');
			if (!popperElement.current.contains(e.target) || e.keyCode === 27) {
				e.stopPropagation();
				console.log('propagation is being stopped!!');

				closeFn();
			}
		};

		document.addEventListener('click', handleEscapePopper);
		document.addEventListener('keyup', handleEscapePopper);

		return () => {
			document.removeEventListener('click', handleEscapePopper);
			document.removeEventListener('keyup', handleEscapePopper);
		};
	}, []);

	return (
		<div
			ref={popperElement}
			style={styles.popper}
			{...attributes.popper}
			id='link-popper-element'>
			<div className='link-popper'>
				{/* PASS THROUGH CHILDREN */}
				{children}
			</div>
		</div>
	);
};

export default AddLinkPopper;
