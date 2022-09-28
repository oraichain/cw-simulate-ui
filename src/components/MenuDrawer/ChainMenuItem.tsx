import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
} from "@mui/material";
import { useState } from "react";
import { useDeleteChainForSimulation } from "../../utils/setupSimulation";
import CodesMenuItem from "./CodesMenuItem";
import InstancesMenuItem from "./InstancesMenuItem";
import T1MenuItem from "./T1MenuItem";

export interface IChainMenuItemProps {
  chainId: string;
}
export default function ChainMenuItem(props: IChainMenuItemProps) {
  const { chainId } = props;

  const [showDelChain, setShowDelChain] = useState(false);

  return (
    <T1MenuItem
      key={chainId}
      nodeId={`chains/${chainId}`}
      label={chainId}
      options={[
        <MenuItem
          key="remove-chain"
          onClick={() => {
            setShowDelChain(true);
          }}
        >
          Remove
        </MenuItem>,
      ]}
      optionsExtras={({ close }) => [
        <DeleteChainDialog
          key="remove-chain"
          chainId={chainId}
          open={showDelChain}
          onClose={() => {
            setShowDelChain(false);
            close();
          }}
        />,
      ]}
    >
      <T1MenuItem label="Config" nodeId={`${chainId}/config`} link={`/chains/${chainId}#config`} />
      <T1MenuItem label="State" nodeId={`${chainId}/state`} link={`/chains/${chainId}#state`} />
      <T1MenuItem label="Accounts" nodeId={`${chainId}/accounts`} link={`/chains/${chainId}#accounts`} />
      <CodesMenuItem chainId={chainId} />
      <InstancesMenuItem chainId={chainId} />
    </T1MenuItem>
  );
}

interface IDeleteChainDialogProps {
  chainId: string;
  open: boolean;
  onClose(): void;
}
function DeleteChainDialog(props: IDeleteChainDialogProps) {
  const { chainId, ...rest } = props;

  const deleteChain = useDeleteChainForSimulation();

  return (
    <Dialog {...rest}>
      <DialogTitle>Confirm Chain Removal</DialogTitle>
      <DialogContent>
        Are you absolutely certain you wish to remove chain {chainId}?
      </DialogContent>
      <DialogActions>
        <Button
          variant="outlined"
          onClick={() => {
            rest.onClose();
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            deleteChain(chainId);
            rest.onClose();
          }}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
