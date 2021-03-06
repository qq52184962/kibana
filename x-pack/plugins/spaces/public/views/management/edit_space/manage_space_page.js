"use strict";
/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const eui_1 = require("@elastic/eui");
const react_1 = tslib_1.__importStar(require("react"));
// @ts-ignore
const notify_1 = require("ui/notify");
const common_1 = require("../../../../common");
const components_1 = require("../../../components");
const secure_space_message_1 = require("../components/secure_space_message");
const unauthorized_prompt_1 = require("../components/unauthorized_prompt");
const lib_1 = require("../lib");
const validate_space_1 = require("../lib/validate_space");
const customize_space_avatar_1 = require("./customize_space_avatar");
const delete_spaces_button_1 = require("./delete_spaces_button");
const reserved_space_badge_1 = require("./reserved_space_badge");
const space_identifier_1 = require("./space_identifier");
class ManageSpacePage extends react_1.Component {
    constructor(props) {
        super(props);
        this.getLoadingIndicator = () => {
            return (react_1.default.createElement("div", null,
                react_1.default.createElement(eui_1.EuiLoadingSpinner, { size: 'xl' }),
                ' ',
                react_1.default.createElement(eui_1.EuiTitle, null,
                    react_1.default.createElement("h1", null, "Loading..."))));
        };
        this.getForm = () => {
            const { userProfile } = this.props;
            if (!userProfile.hasCapability('manageSpaces')) {
                return react_1.default.createElement(unauthorized_prompt_1.UnauthorizedPrompt, null);
            }
            const { name = '', description = '' } = this.state.space;
            return (react_1.default.createElement(eui_1.EuiForm, null,
                this.getFormHeading(),
                react_1.default.createElement(eui_1.EuiSpacer, null),
                react_1.default.createElement(eui_1.EuiFormRow, Object.assign({ label: "Name" }, this.validator.validateSpaceName(this.state.space), { fullWidth: true }),
                    react_1.default.createElement(eui_1.EuiFieldText, { name: "name", placeholder: 'Awesome space', value: name, onChange: this.onNameChange, fullWidth: true })),
                name && (react_1.default.createElement(react_1.Fragment, null,
                    react_1.default.createElement(eui_1.EuiFlexGroup, { responsive: false },
                        react_1.default.createElement(eui_1.EuiFlexItem, { grow: false },
                            react_1.default.createElement(eui_1.EuiFormRow, { label: "Avatar" },
                                react_1.default.createElement(components_1.SpaceAvatar, { space: this.state.space, size: "l" }))),
                        react_1.default.createElement(customize_space_avatar_1.CustomizeSpaceAvatar, { space: this.state.space, onChange: this.onAvatarChange })),
                    react_1.default.createElement(eui_1.EuiSpacer, null))),
                this.state.space && common_1.isReservedSpace(this.state.space) ? null : (react_1.default.createElement(react_1.Fragment, null,
                    react_1.default.createElement(space_identifier_1.SpaceIdentifier, { space: this.state.space, editable: !this.editingExistingSpace(), onChange: this.onSpaceIdentifierChange, validator: this.validator }))),
                react_1.default.createElement(eui_1.EuiFormRow, Object.assign({ label: "Description (optional)" }, this.validator.validateSpaceDescription(this.state.space), { fullWidth: true }),
                    react_1.default.createElement(eui_1.EuiFieldText, { name: "description", placeholder: 'This is where the magic happens', value: description, onChange: this.onDescriptionChange, fullWidth: true })),
                react_1.default.createElement(eui_1.EuiHorizontalRule, null),
                this.getFormButtons()));
        };
        this.getFormHeading = () => {
            return (react_1.default.createElement(eui_1.EuiTitle, { size: "l" },
                react_1.default.createElement("h1", null,
                    this.getTitle(),
                    " ",
                    react_1.default.createElement(reserved_space_badge_1.ReservedSpaceBadge, { space: this.state.space }))));
        };
        this.getTitle = () => {
            if (this.editingExistingSpace()) {
                return `Edit space`;
            }
            return `Create space`;
        };
        this.maybeGetSecureSpacesMessage = () => {
            if (this.editingExistingSpace()) {
                return react_1.default.createElement(secure_space_message_1.SecureSpaceMessage, { userProfile: this.props.userProfile });
            }
            return null;
        };
        this.getFormButtons = () => {
            const saveText = this.editingExistingSpace() ? 'Update space' : 'Create space';
            return (react_1.default.createElement(eui_1.EuiFlexGroup, { responsive: false },
                react_1.default.createElement(eui_1.EuiFlexItem, { grow: false },
                    react_1.default.createElement(eui_1.EuiButton, { fill: true, onClick: this.saveSpace, "data-test-subj": "save-space-button" }, saveText)),
                react_1.default.createElement(eui_1.EuiFlexItem, { grow: false },
                    react_1.default.createElement(eui_1.EuiButtonEmpty, { onClick: this.backToSpacesList, "data-test-subj": "cancel-space-button" }, "Cancel")),
                react_1.default.createElement(eui_1.EuiFlexItem, { grow: true }),
                this.getActionButton()));
        };
        this.getActionButton = () => {
            if (this.state.space && this.editingExistingSpace() && !common_1.isReservedSpace(this.state.space)) {
                return (react_1.default.createElement(eui_1.EuiFlexItem, { grow: false },
                    react_1.default.createElement(delete_spaces_button_1.DeleteSpacesButton, { "data-test-subj": "delete-space-button", space: this.state.space, spacesManager: this.props.spacesManager, spacesNavState: this.props.spacesNavState, onDelete: this.backToSpacesList })));
            }
            return null;
        };
        this.onNameChange = (e) => {
            if (!this.state.space) {
                return;
            }
            const canUpdateId = !this.editingExistingSpace();
            let { id } = this.state.space;
            if (canUpdateId) {
                id = lib_1.toSpaceIdentifier(e.target.value);
            }
            this.setState({
                space: {
                    ...this.state.space,
                    name: e.target.value,
                    id,
                },
            });
        };
        this.onDescriptionChange = (e) => {
            this.setState({
                space: {
                    ...this.state.space,
                    description: e.target.value,
                },
            });
        };
        this.onSpaceIdentifierChange = (e) => {
            this.setState({
                space: {
                    ...this.state.space,
                    id: lib_1.toSpaceIdentifier(e.target.value),
                },
            });
        };
        this.onAvatarChange = (space) => {
            this.setState({
                space,
            });
        };
        this.saveSpace = () => {
            this.validator.enableValidation();
            const result = this.validator.validateForSave(this.state.space);
            if (result.isInvalid) {
                this.setState({
                    formError: result,
                });
                return;
            }
            this.performSave();
        };
        this.performSave = () => {
            if (!this.state.space) {
                return;
            }
            const name = this.state.space.name || '';
            const { id = lib_1.toSpaceIdentifier(name), description, initials, color } = this.state.space;
            const params = {
                name,
                id,
                description,
                initials,
                color,
            };
            let action;
            if (this.editingExistingSpace()) {
                action = this.props.spacesManager.updateSpace(params);
            }
            else {
                action = this.props.spacesManager.createSpace(params);
            }
            action
                .then(() => {
                this.props.spacesNavState.refreshSpacesList();
                notify_1.toastNotifications.addSuccess(`'${name}' was saved`);
                window.location.hash = `#/management/spaces/list`;
            })
                .catch(error => {
                const { message = '' } = error.data || {};
                notify_1.toastNotifications.addDanger(`Error saving space: ${message}`);
            });
        };
        this.backToSpacesList = () => {
            window.location.hash = `#/management/spaces/list`;
        };
        this.editingExistingSpace = () => !!this.props.spaceId;
        this.validator = new validate_space_1.SpaceValidator({ shouldValidate: false });
        this.state = {
            isLoading: true,
            space: {},
        };
    }
    componentDidMount() {
        const { spaceId, spacesManager } = this.props;
        if (spaceId) {
            spacesManager
                .getSpace(spaceId)
                .then((result) => {
                if (result.data) {
                    this.setState({
                        space: result.data,
                        isLoading: false,
                    });
                }
            })
                .catch(error => {
                const { message = '' } = error.data || {};
                notify_1.toastNotifications.addDanger(`Error loading space: ${message}`);
                this.backToSpacesList();
            });
        }
        else {
            this.setState({ isLoading: false });
        }
    }
    render() {
        const content = this.state.isLoading ? this.getLoadingIndicator() : this.getForm();
        return (react_1.default.createElement(eui_1.EuiPage, { className: "spcManagePage" },
            react_1.default.createElement(eui_1.EuiPageBody, null,
                react_1.default.createElement(eui_1.EuiPageContent, { className: "spcManagePage__content" },
                    react_1.default.createElement(eui_1.EuiPageContentBody, null, content)),
                this.maybeGetSecureSpacesMessage())));
    }
}
exports.ManageSpacePage = ManageSpacePage;
