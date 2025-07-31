import Container from '@/components/shared/Container'

const logData = [
    {
        version: '1.2.1',
        date: '22 May 2025',
        updateContent: [
            `[Fixed] Missing no notification image`,
            `[Fixed] Input textarea size issues`,
            `[Added] Slider component`,
        ],
    },
    {
        version: '1.2.0',
        date: '27 Apr 2025',
        updateContent: [
            `[Fixed] Z-index ordering issues bewteen components Dialog, Drawer, Select & Header.`,
            `[Fixed] pauseOnHover prop not working in InfiniteMovingCards component.`,
            `[Fixed] Missing constant in Search.tsx component`,
            `[Updated] Eslint to latest version.`,
            `[Updated] next-intl to latest versions.`,
            `[Updated] Next.js to latest versions.`,
        ],
    },
    {
        version: '1.1.2',
        date: '03 Apr 2025',
        updateContent: [
            `[Added] JavaScript version of the template`,
            `[Fixed] Checkbox disabled hover style issues`,
            `[Fixed] Form inline alignment issues`,
            `[Fixed] Datepicker component not closing automatically issues`,
            `[Fixed] Switcher class override issues`,
            `[Updated] Next.js to latest versions.`,
        ],
    },
    {
        version: '1.1.1',
        date: '10 Mar 2025',
        updateContent: [
            `[Added] Landing page.`,
            `[Fixed] Datepicker component focus styling issues`,
            `[Fixed] Select component input contrast issues`,
            `[Updated] Various dependencies to their latest versions.`,
        ],
    },
    {
        version: '1.1.0',
        date: '23 Feb 2025',
        updateContent: [
            `[Updated] Tailwind to version 4.`,
            `[Updated] Various dependencies to their latest versions.`,
            `[Changes] Applied layers to existing CSS.`,
            `[Fixed] Minor styling issues`,
        ],
    },
    {
        version: '1.0.1',
        date: '10 Feb 2025',
        updateContent: [`[Fixed] Application crash on mobile view`],
    },
    {
        version: '1.0.0',
        date: '02 Feb 2025',
        updateContent: ['[Release] Initial Release.'],
    },
]

const Log = (props) => {
    return (
        <div className={`py-4 ${props.border && 'border-bottom'}`}>
            <div className="flex items-center">
                <h5 className="font-weight-normal mb-0 mr-3">
                    {props.version}
                </h5>
                <code>{props.date}</code>
            </div>
            <div className="api-container p-0 border-0 mt-3">
                {props.children}
            </div>
        </div>
    )
}

const Page = () => {
    return (
        <Container>
            <div>
                <h4>Changelog</h4>
                {logData.map((elm) => (
                    <Log
                        key={elm.version}
                        version={`v${elm.version}`}
                        date={elm.date}
                    >
                        {elm.updateContent.length > 0 ? (
                            <ul>
                                {elm.updateContent.map((item, i) => (
                                    <li key={i}>- {item}</li>
                                ))}
                            </ul>
                        ) : null}
                    </Log>
                ))}
            </div>
        </Container>
    )
}

export default Page
