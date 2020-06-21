import React from 'react';
import DocumentSingleSVG from '../../../assets/svg/DocumentSingleSVG';

const NavDocument = ({ path, child }) => {
	return (
		<p className='file-nav document' key={'doc-' + child.id}>
			<DocumentSingleSVG />
			{child.name}
		</p>
	);
};

export default NavDocument;
