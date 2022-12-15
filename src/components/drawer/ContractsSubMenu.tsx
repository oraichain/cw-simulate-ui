import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import DownloadIcon from "@mui/icons-material/Download";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import UploadIcon from "@mui/icons-material/Upload";
import {
  Autocomplete,
  AutocompleteRenderInputParams,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  ListItemIcon,
  ListItemText,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import type { CodeInfo, Coin } from "@terran-one/cw-simulate";
import { useSetAtom } from "jotai";
import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../atoms/snackbarNotificationState";
import { drawerSubMenuState } from "../../atoms/uiState";
import T1Container from "../grid/T1Container";
import { JsonCodeMirrorEditor } from "../JsonCodeMirrorEditor";
import UploadModal from "../upload/UploadModal";
import SubMenuHeader from "./SubMenuHeader";
import T1MenuItem from "./T1MenuItem";
import useSimulation from "../../hooks/useSimulation";
import {
  compareDeep,
  useAccounts,
  useCode,
  useCodes,
} from "../../CWSimulationBridge";
import { downloadWasm } from "../../utils/fileUtils";
import Funds from "../Funds";
import useDebounce from "../../hooks/useDebounce";

export interface IContractsSubMenuProps {}

export default function ContractsSubMenu(props: IContractsSubMenuProps) {
  const sim = useSimulation();

  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const codes = Object.entries(useCodes(sim)).filter(([, c]) => !c.hidden);

  return (
    <>
      <SubMenuHeader
        title="Contracts"
        options={[
          <MenuItem
            key="upload-contract"
            onClick={() => setOpenUploadDialog(true)}
          >
            <ListItemIcon>
              <UploadIcon />
            </ListItemIcon>
            <ListItemText>Upload new contract</ListItemText>
          </MenuItem>,
        ]}
        optionsExtras={({ close }) => (
          <>
            <UploadModal
              variant="contract"
              open={openUploadDialog}
              onClose={() => {
                setOpenUploadDialog(false);
                close();
              }}
            />
          </>
        )}
      />

      {codes.map(([codeId]) => (
        <CodeMenuItem key={codeId} codeId={parseInt(codeId)} />
      ))}
    </>
  );
}

interface ICodeMenuItemProps {
  codeId: number;
}

function CodeMenuItem({ codeId }: ICodeMenuItemProps) {
  const sim = useSimulation();
  const code = useCode(sim, codeId)!;

  const [openInstantiate, setOpenInstantiate] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const download = useCallback(() => {
    downloadWasm(code.wasmCode, code.name ?? "<unnamed code>");
  }, [code]);

  return (
    <T1MenuItem
      label={`${code.codeId}: ${code.name}`}
      textEllipsis
      options={({ close }) => [
        <MenuItem key="instantiate" onClick={() => setOpenInstantiate(true)}>
          <ListItemIcon>
            <RocketLaunchIcon />
          </ListItemIcon>
          <ListItemText>Instantiate</ListItemText>
        </MenuItem>,
        <MenuItem key="download" onClick={download}>
          <ListItemIcon>
            <DownloadIcon />
          </ListItemIcon>
          <ListItemText>Download Source</ListItemText>
        </MenuItem>,
        <MenuItem key="delete" onClick={() => setOpenDelete(true)}>
          <ListItemIcon>
            <DeleteForeverIcon />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>,
      ]}
      optionsExtras={({ close }) => (
        <>
          <InstantiateDialog
            codeId={codeId}
            open={openInstantiate}
            onClose={() => {
              setOpenInstantiate(false);
              close();
            }}
          />
          <DeleteDialog
            codeId={codeId}
            open={openDelete}
            onClose={() => {
              setOpenDelete(false);
              close();
            }}
          />
        </>
      )}
    />
  );
}

interface IDeleteDialogProps {
  codeId: number;
  open: boolean;
  onClose: () => void;
}

function DeleteDialog(props: IDeleteDialogProps) {
  const { codeId, open, onClose } = props;
  const sim = useSimulation();
  const setNotification = useNotification();

  const handleDeleteContract = () => {
    sim.hideCode(codeId);
    setNotification("Successfully deleted contract");
    onClose?.();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Delete contract</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete this contract?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleDeleteContract}>Delete</Button>
      </DialogActions>
    </Dialog>
  );
}

interface IInstantiateDialogProps {
  codeId: number;
  open: boolean;

  onClose(): void;
}

function InstantiateDialog(props: IInstantiateDialogProps) {
  const { codeId, open, onClose } = props;

  const sim = useSimulation();
  const navigate = useNavigate();
  const setNotification = useNotification();
  const setDrawerSubMenu = useSetAtom(drawerSubMenuState);
  const [funds, setFunds] = useState<Coin[]>([]);
  const [isFundsValid, setFundsValid] = useState(true);
  const [payload, setPayload] = useState("");
  const [instancelabel, setInstanceLabel] = useState<string>("");
  const ref = useRef<HTMLInputElement | null>();
  const placeholder = {
    count: 0,
  };

  const accounts = useAccounts(sim);
  const code = useCode(sim, codeId)!;
  const [account, setAccount] = useState(Object.keys(accounts)[0]);
  const handleLabelChange = useDebounce(
    () => {
      const val = ref.current?.value.trim();
      setInstanceLabel(val ? val : "");
    },
    200,
    []
  );
  const handleInstantiate = useCallback(async () => {
    const instantiateMsg =
      payload.length === 0 ? placeholder : JSON.parse(payload);

    try {
      const [sender] = Object.entries(accounts).find(
        ([addr]) => addr === account
      ) ?? [undefined, []];
      if (!sender) {
        setNotification("Please select an account", { severity: "error" });
        return;
      }

      const contract = await sim.instantiate(
        sender,
        code.codeId,
        instantiateMsg,
        funds,
        instancelabel
      );
      navigate(`/instances/${contract.address}`);
      onClose();
      setDrawerSubMenu(undefined);
    } catch (e: any) {
      setNotification(`Unable to instantiate with error: ${e.message}`, {
        severity: "error",
      });
      console.error(e);
    }
  }, [account, funds, payload, onClose]);

  return (
    <Dialog open={open} onClose={() => onClose()}>
      <DialogTitle>Instantiate Contract</DialogTitle>
      <DialogContent sx={{ pt: "5px !important" }}>
        <Autocomplete
          onInputChange={(_, value) => setAccount(value)}
          sx={{ width: "100%" }}
          defaultValue={Object.keys(accounts)[0]}
          renderInput={(params: AutocompleteRenderInputParams) => (
            <TextField {...params} label="Sender" />
          )}
          options={Object.keys(accounts)}
        />
        <Funds
          TextComponent={DialogContentText}
          onChange={setFunds}
          onValidate={setFundsValid}
          sx={{ mt: 2 }}
        />
        <TextField
          fullWidth
          inputRef={ref}
          defaultValue={instancelabel}
          onChange={handleLabelChange}
          label="Label"
          sx={{ mt: 2 }}
        />
      </DialogContent>

      <DialogContent>
        <DialogContentText>InstantiateMsg</DialogContentText>
        <T1Container sx={{ width: 400, height: 220 }}>
          <JsonCodeMirrorEditor
            jsonValue={""}
            placeholder={placeholder}
            onChange={setPayload}
          />
        </T1Container>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={!payload || !isFundsValid}
          onClick={handleInstantiate}
        >
          Instantiate
        </Button>
      </DialogActions>
    </Dialog>
  );
}
