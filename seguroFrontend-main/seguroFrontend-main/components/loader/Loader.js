import React from 'react'

const Loader = ({isVisible = true}) => {
    return (
        <div className={!isVisible ? 'hidden' : 'fixed inset-0 z-[10000] w-[100%] bg-gray-800 opacity-40 px-[48%] py-[45vh]'}>
            <svg className="h-20" version="1.1" id="L4" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                viewBox="0 0 100 100" enableBackground="new 0 0 0 0" xmlSpace="preserve">
                <circle fill="#fff" stroke="none" cx="6" cy="50" r="6">
                    <animate
                        attributeName="opacity"
                        dur="1s"
                        values="0;1;0"
                        repeatCount="indefinite"
                        begin="0.1" />
                </circle>
                <circle fill="#fff" stroke="none" cx="26" cy="50" r="6">
                    <animate
                        attributeName="opacity"
                        dur="1s"
                        values="0;1;0"
                        repeatCount="indefinite"
                        begin="0.2" />
                </circle>
                <circle fill="#fff" stroke="none" cx="46" cy="50" r="6">
                    <animate
                        attributeName="opacity"
                        dur="1s"
                        values="0;1;0"
                        repeatCount="indefinite"
                        begin="0.3" />
                </circle>
            </svg>
        </div>
    )
}

export default Loader