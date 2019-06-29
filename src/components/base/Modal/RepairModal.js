// @flow

import React, { PureComponent } from 'react'
import { translate } from 'react-i18next'
import styled from 'styled-components'
import { repairChoices } from '@ledgerhq/live-common/lib/hw/firmwareUpdate-repair'
import type { T } from 'types/common'
import TrackPage from 'analytics/TrackPage'
import IconCheck from 'icons/Check'
import Button from 'components/base/Button'
import Box from 'components/base/Box'
import Text from 'components/base/Text'
import ProgressCircle from 'components/ProgressCircle'
import TranslatedError from 'components/TranslatedError'
import ConnectTroubleshootingHelpButton from 'components/ConnectTroubleshootingHelpButton'
import FlashMCU from 'components/FlashMCU'
import ExclamationCircleThin from 'icons/ExclamationCircleThin'
import Modal from './index'
import ModalBody from './ModalBody'

const Container = styled(Box).attrs({
  alignItems: 'center',
  fontSize: 4,
  color: 'dark',
})``

const ChoiceBox = styled.div`
  display: flex;
  flex-direction: row;
  border-radius: 4px;
  box-shadow: ${props => (props.selected ? '0 2px 4px 0 rgba(0, 0, 0, 0.08)' : null)};
  border: solid 1px
    ${props => (props.selected ? props.theme.colors.wallet : props.theme.colors.fog)};
  height: 48px;
  padding: 0 24px;
  margin-bottom: 8px;
  align-items: center;
  justify-content: space-between;
`

const Choice = React.memo(({ selected, choice, onSelect }) => (
  <ChoiceBox selected={selected} onClick={() => onSelect(selected ? null : choice)}>
    <Text ff="Open Sans|SemiBold" fontSize={4}>
      {choice.label}
    </Text>
    {selected ? (
      <Box color="wallet">
        <IconCheck size={16} />
      </Box>
    ) : null}
  </ChoiceBox>
))

const DisclaimerStep = ({ desc }: { desc?: string }) => (
  <Box>
    {desc ? (
      <Box ff="Open Sans" color="smoke" fontSize={4} textAlign="center" mb={2}>
        {desc}
      </Box>
    ) : null}
  </Box>
)

const FlashStep = ({
  progress,
  t,
  isAlreadyBootloader,
}: {
  progress: number,
  t: *,
  isAlreadyBootloader?: boolean,
}) =>
  progress === 0 && !isAlreadyBootloader ? (
    <Container>
      <FlashMCU />
    </Container>
  ) : (
    <Box>
      <Box mx={7} align="center">
        <ProgressCircle size={64} progress={progress} />
      </Box>
      <Box mx={7} mt={3} mb={2} ff="Museo Sans|Regular" color="dark" textAlign="center">
        {t(`manager.modal.steps.flash`)}
      </Box>
      <Box mx={7} mt={2} mb={2}>
        <Text ff="Open Sans|Regular" align="center" color="graphite" fontSize={4}>
          {t('manager.modal.mcuPin')}
        </Text>
      </Box>
    </Box>
  )

const ErrorStep = ({ error }: { error: Error }) => (
  <Box>
    <Container>
      <Box color="alertRed">
        <ExclamationCircleThin size={44} />
      </Box>
      <Box
        color="dark"
        mt={4}
        fontSize={6}
        ff="Museo Sans|Regular"
        textAlign="center"
        style={{ maxWidth: 350 }}
      >
        <TranslatedError error={error} field="title" />
      </Box>
      <Box
        color="graphite"
        mt={4}
        fontSize={6}
        ff="Open Sans"
        textAlign="center"
        style={{ maxWidth: 350 }}
      >
        <TranslatedError error={error} field="description" />
      </Box>
    </Container>
  </Box>
)

type Props = {
  isOpened: boolean,
  isDanger: boolean,
  title: string,
  subTitle?: string,
  desc: string,
  renderIcon?: Function,
  confirmText?: string,
  cancelText?: string,
  onReject: Function,
  repair: (?string) => *,
  t: T,
  isLoading?: boolean,
  analyticsName: string,
  cancellable?: boolean,
  progress: number,
  error?: Error,
  isAlreadyBootloader?: boolean,
}

class RepairModal extends PureComponent<Props, *> {
  state = {
    selectedOption: null,
  }

  onSelectOption = selectedOption => {
    this.setState({ selectedOption })
  }

  render() {
    const {
      cancellable,
      isOpened,
      title,
      desc,
      confirmText,
      isDanger,
      onReject,
      repair,
      isLoading,
      renderIcon,
      t,
      analyticsName,
      progress,
      error,
      isAlreadyBootloader,
      ...props
    } = this.props
    const { selectedOption } = this.state
    const onClose = !cancellable && isLoading ? undefined : onReject

    return (
      <Modal
        isOpened={isOpened}
        centered
        preventBackdropClick={isLoading}
        onClose={onClose}
        {...props}
      >
        <TrackPage category="Modal" name={analyticsName} />
        <ModalBody
          title={title}
          onClose={onClose}
          noScroll
          render={() => (
            <Box>
              {error ? (
                <ErrorStep error={error} />
              ) : isLoading ? (
                <FlashStep t={t} progress={progress} isAlreadyBootloader={isAlreadyBootloader} />
              ) : (
                <DisclaimerStep desc={desc} />
              )}

              {!isLoading && !error ? (
                <Box py={2} px={5} color="dark" fontSize={4}>
                  {repairChoices.map(choice => (
                    <Choice
                      onSelect={this.onSelectOption}
                      selected={choice === selectedOption}
                      choice={choice}
                    />
                  ))}
                </Box>
              ) : null}
            </Box>
          )}
          renderFooter={() =>
            !isLoading ? (
              <Box horizontal align="center" flow={2} flex={1}>
                <ConnectTroubleshootingHelpButton />
                <div style={{ flex: 1 }} />
                <Button onClick={onReject}>{t(`common.${error ? 'close' : 'cancel'}`)}</Button>
                <Button
                  onClick={selectedOption ? () => repair(selectedOption.forceMCU) : null}
                  primary={!isDanger}
                  danger={isDanger}
                  isLoading={isLoading}
                  disabled={isLoading || !selectedOption}
                >
                  {t('settings.repairDevice.button')}
                </Button>
              </Box>
            ) : null
          }
        />
      </Modal>
    )
  }
}

export default translate()(RepairModal)
