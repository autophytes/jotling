import React, { useState } from 'react';
import PopupModal from '../containers/PopupModal';
import PopupModalNoOverlay from '../containers/PopupModalNoOverlay';
import ConfirmDeleteForm from '../forms/ConfirmDeleteForm';

const ConfirmDeleteButton = (props) => {
	// REQUIRES title(string) prop
	// REQUIRES message(string) prop
	// REQUIRES deleteFunc(func) prop
	// OPTIONAL noOverlay (bool) prop

	const [displayModal, setDisplayModal] = useState(false);

	return (
		<>
			<span onClick={() => setDisplayModal(true)}>{props.children}</span>
			{displayModal &&
				(!props.noOverlay ? (
					<PopupModal setDisplayModal={setDisplayModal} width='32rem'>
						<ConfirmDeleteForm
							setDisplayModal={setDisplayModal}
							title={props.title}
							message={props.message}
							deleteFunc={props.deleteFunc}
						/>
					</PopupModal>
				) : (
					<PopupModalNoOverlay width='32rem' zIndex='2'>
						<ConfirmDeleteForm
							setDisplayModal={setDisplayModal}
							title={props.title}
							message={props.message}
							deleteFunc={props.deleteFunc}
						/>
					</PopupModalNoOverlay>
				))}
		</>
	);
};

export default ConfirmDeleteButton;
