import React, { useState } from 'react';
import TemplatesSVG from '../../../assets/svg/TemplatesSVG';
import WikiTemplatesForm from '../../forms/WikiTemplatesForm';

const WikiTemplatesButton = () => {
	const [showTemplates, setShowTemplates] = useState(false);

	return (
		<>
			<button className='file-nav document' onClick={() => setShowTemplates(true)}>
				<div className='svg-wrapper'>
					<TemplatesSVG />
				</div>
				<span>Wiki Templates</span>
			</button>

			{showTemplates && <WikiTemplatesForm setDisplayModal={setShowTemplates} />}
		</>
	);
};

export default WikiTemplatesButton;
