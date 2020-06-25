import React, { useCallback } from 'react';
import DocumentSingleSVG from '../../../assets/svg/DocumentSingleSVG';

const NavDocument = ({
	path,
	child,
	currentDoc,
	setCurrentDoc,
	lastClicked,
	setLastClicked,
}) => {
	const handleClick = useCallback(() => {
		currentDoc !== child.fileName && setCurrentDoc(child.fileName);
		setLastClicked({ type: 'document', id: child.id });
	}, [setCurrentDoc, child]);

	return (
		<p
			className={'file-nav document' + (currentDoc === child.fileName ? ' active' : '')}
			key={'doc-' + child.id}
			onMouseDown={handleClick}>
			<div className='svg-wrapper'>
				<DocumentSingleSVG />
			</div>
			{child.name}
		</p>
	);
};

export default NavDocument;
