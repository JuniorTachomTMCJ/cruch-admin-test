import {
  Modal,
  Link,
  Text,
  Thumbnail,
  Page,
  Frame,
  Badge,
  Layout,
  Loading,
  LegacyCard,
  IndexTable,
  EmptySearchResult,
  useIndexResourceState,
  IndexFilters,
  useSetIndexFiltersMode,
  ChoiceList,
  Icon
} from "@shopify/polaris";
import { ImageMajor, ExportMinor } from "@shopify/polaris-icons";
import { useState, useEffect, useCallback } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Redirect } from '@shopify/app-bridge/actions';
import { utils, writeFileXLSX } from "xlsx";
export { utils, writeFileXLSX };

export default function HomePage() {
  const app = useAppBridge();
  const redirect = Redirect.create(app);

  const [retraits, setRetraits] = useState([]);
  const [filteredRetraits, setFilteredRetraits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [entreprises, setEntreprises] = useState([]);

  const resourceName = {
    singular: "Point de retrait",
    plural: "Points de retrait",
  };

  const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(retraits);
  
  const emptyStateMarkup = (
    <EmptySearchResult
      title={"Aucun point de retrait trouvés"}
      description={
        "Essayez de modifier les filtres ou les termes de recherche"
      }
      withIllustration
    />
  );

  const rowMarkup = filteredRetraits.map(({ id, name, address, isActive }, index) => (
    <IndexTable.Row
      id={id}
      key={id}
      selected={selectedResources.includes(id)}
      position={index}
    >
      <IndexTable.Cell>
        <Link
          dataPrimaryLink
          url={`/retraits/${id.match(/\/(\d+)$/)[1]}`}
          monochrome
          removeUnderline
        >
          <Text variant="bodyMd" fontWeight="bold" as="span">
            {name}
          </Text>
        </Link>
      </IndexTable.Cell>
      <IndexTable.Cell>{address.address1}</IndexTable.Cell>
      <IndexTable.Cell>{address.city}</IndexTable.Cell>
      <IndexTable.Cell>{address.country}</IndexTable.Cell>
      <IndexTable.Cell>
        {isActive ? (
          <Badge progress="authorized" status="success">
            Actif
          </Badge>
        ) : (
          <Badge progress="incomplete" status="attention">
            Inactif
          </Badge>
        )}
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  const exportToExcel = async () => {
    const tableau = filteredRetraits.map((retrait, index) => {
      return {
        Nom: retrait.name,
        Adresse: retrait.address.address1,
        Ville: retrait.address.city,
        Pays: retrait.address.country,
        Statut: retrait.isActive ? "Actif" : "Inactif",
      };
    });
    const wb = utils.book_new();
    const ws = utils.json_to_sheet(tableau);
    utils.book_append_sheet(wb, ws, "Sheet1");
    writeFileXLSX(wb, "Retraits.xlsx");
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const [itemStrings, setItemStrings] = useState(["Toutes"]);
  const deleteView = (index) => {
    const newItemStrings = [...itemStrings];
    newItemStrings.splice(index, 1);
    setItemStrings(newItemStrings);
    setSelected(0);
  };

  const duplicateView = async (name) => {
    setItemStrings([...itemStrings, name]);
    setSelected(itemStrings.length);
    await sleep(1);
    return true;
  };

  const tabs = itemStrings.map((item, index) => ({
    content: item,
    index,
    onAction: () => {},
    id: `${item}-${index}`,
    isLocked: index === 0,
    actions:
      index === 0
        ? []
        : [
            {
              type: "rename",
              onAction: () => {},
              onPrimaryAction: async (value) => {
                const newItemsStrings = tabs.map((item, idx) => {
                  if (idx === index) {
                    return value;
                  }
                  return item.content;
                });
                await sleep(1);
                setItemStrings(newItemsStrings);
                return true;
              },
            },
            {
              type: "duplicate",
              onPrimaryAction: async (value) => {
                await sleep(1);
                duplicateView(value);
                return true;
              },
            },
            {
              type: "edit",
            },
            {
              type: "delete",
              onPrimaryAction: async () => {
                await sleep(1);
                deleteView(index);
                return true;
              },
            },
          ],
  }));
  const [selected, setSelected] = useState(0);
  const onCreateNewView = async (value) => {
    await sleep(500);
    setItemStrings([...itemStrings, value]);
    setSelected(itemStrings.length);
    return true;
  };

  const sortOptions = [
    { label: "Titre", value: "name asc", directionLabel: "A-Z" },
    { label: "Titre", value: "name desc", directionLabel: "Z-A" },
    { label: "Adresse", value: "address asc", directionLabel: "A-Z" },
    { label: "Adresse", value: "address desc", directionLabel: "Z-A" },
    { label: "Ville", value: "city asc", directionLabel: "A-Z" },
    { label: "Ville", value: "city desc", directionLabel: "Z-A" },
    { label: "Pays", value: "country asc", directionLabel: "A-Z" },
    { label: "Pays", value: "country desc", directionLabel: "Z-A" },
    { label: "Statut", value: "status asc", directionLabel: "A-Z" },
    { label: "Statut", value: "status desc", directionLabel: "Z-A" },
  ];

  const [sortSelected, setSortSelected] = useState(["name asc"]);
  const handleSortSelected = useCallback(
    (value) => {
      setSortSelected(value);
      const [sortKey, sortDirection] = value[0].split(" ");
      const sortedRetraits = [...filteredRetraits];

      switch (sortKey) {
        case "name":
          sortedRetraits.sort((a, b) => {
            if (sortDirection === "asc") {
              return a.name.localeCompare(b.name);
            } else {
              return b.name.localeCompare(a.name);
            }
          });
          break;
        case "address":
          sortedRetraits.sort((a, b) => {
            if (sortDirection === "asc") {
              return a.address.address1.localeCompare(b.address.address1);
            } else {
              return b.address.address1.localeCompare(a.address.address1);
            }
          });
          break;
        case "city":
          sortedRetraits.sort((a, b) => {
            if (sortDirection === "asc") {
              return a.address.city.localeCompare(b.address.city);
            } else {
              return b.address.city.localeCompare(a.address.city);
            }
          });
          break;
        case "country":
          sortedRetraits.sort((a, b) => {
            if (sortDirection === "asc") {
              return a.address.country.localeCompare(b.address.country);
            } else {
              return b.address.country.localeCompare(a.address.country);
            }
          });
          break;
        case "status":
          sortedRetraits.sort((a, b) => {
            if (sortDirection === "asc") {
              return String(a.isActive).localeCompare(String(b.isActive));
            } else {
              return String(b.isActive).localeCompare(String(a.isActive));
            }
          });
          break;
        default:
          break;
      }
      setFilteredRetraits(sortedRetraits);
    },
    [filteredRetraits]
  );

  const { mode, setMode } = useSetIndexFiltersMode();
  const onHandleCancel = () => {
    setQueryValue("");
    setFilteredRetraits(retraits);
  };

  const onHandleSave = async () => {
    await sleep(1);
    return true;
  };

  const primaryAction =
    selected === 0
      ? {
          type: "save-as",
          onAction: onCreateNewView,
          disabled: false,
          loading: false,
        }
      : {
          type: "save",
          onAction: onHandleSave,
          disabled: false,
          loading: false,
        };

  const [queryValue, setQueryValue] = useState("");
  const [cse, setCse] = useState([]);

  const handleCseChange = useCallback(
    (value) => {
      setCse(value);
      const filteredRetraits = retraits.filter((retrait) => {
        if (value.length === 0) {
          return true;
        }
        return value.includes(String(JSON.parse(retrait.metafields[0].value).ids[0]));
      });

      setFilteredRetraits(filteredRetraits);
    },
    [retraits, filteredRetraits]
  );

  const handleCseRemove = useCallback(() => {
    setCse([]);
    setFilteredRetraits(retraits);
  }, [retraits]);

  const handleFiltersQueryChange = useCallback(
    (value) => {
      setQueryValue(value);
      const searchValueLower = value.toLowerCase();

      if (searchValueLower === "") {
        setFilteredRetraits(retraits);
      } else {
        const filteredRetraits = retraits.filter((retrait) => {
          const name = String(retrait.name).toLowerCase();
          const address = String(retrait.address.address1).toLowerCase();
          const city = String(retrait.address.city).toLowerCase();
          const country = String(retrait.address.country).toLowerCase();
          const isActive = retrait.isActive.toString().toLowerCase();

          return (
            name.includes(searchValueLower) ||
            address.includes(searchValueLower) ||
            city.includes(searchValueLower) ||
            country.includes(searchValueLower) ||
            isActive.includes(searchValueLower)
          );
        });

        setFilteredRetraits(filteredRetraits);
      }
    },
    [retraits]
  );

  const handleFiltersQueryClear = useCallback(() => {
    setQueryValue("");
    var filteredRetraits = retraits;
    if (cse.length >= 1) {
      filteredRetraits = filteredRetraits.filter((retrait) => {
        if (cse.length === 0) {
          return true;
        }
        return cse.includes(String(JSON.parse(retrait.metafields[0].value).ids[0]));
      });
    }
    setFilteredRetraits(filteredRetraits);
  }, [retraits]);

  const filters = [
    {
      key: "cse",
      label: "CSE",
      filter: (
        <ChoiceList
          title="CSE"
          titleHidden
          choices={[
            ...entreprises.map((entreprise) => {
              return {
                label: entreprise.cse_name.value,
                value: entreprise.code_cse.value,
              };
            }),
          ]}
          selected={cse || []}
          onChange={handleCseChange}
          allowMultiple
        />
      ),
      shortcut: true,
    },
  ];

  const appliedFilters = [];
  if (cse && !isEmpty(cse)) {
    const key = "cse";
    appliedFilters.push({
      key,
      label: disambiguateLabel(key, cse),
      onRemove: handleCseRemove,
    });
  }

  function disambiguateLabel(key, value) {
    let entrepriseLabels = {};

    entreprises.forEach((entreprise) => {
      entrepriseLabels[entreprise.code_cse.value] = entreprise.cse_name.value;
    });

    switch (key) {
      case "cse":
        return value
          .map((val) => entrepriseLabels[val] || "État inconnu")
          .join(", ");
      default:
        return value;
    }
  }

  function isEmpty(value) {
    if (Array.isArray(value)) {
      return value.length === 0;
    } else {
      return value === "" || value == null;
    }
  }

  const handleQueryValueRemove = useCallback(() => setQueryValue(""), []);

  const handleFiltersClearAll = useCallback(() => {
    handleQueryValueRemove();
    handleCseRemove();
  }, [handleQueryValueRemove, handleCseRemove]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [locationsResponse, entreprisesResponse] = await Promise.all([
          fetch("https://staging.api.creuch.fr/api/emplacements", {
            method: "GET",
            headers: {
              "Content-type": "application/json",
            },
          }),
          fetch("https://staging.api.creuch.fr/api/entreprises", {
            method: "GET",
            headers: { "Content-type": "application/json" },
          }),
        ]);

        const [locationsData, entreprisesData] = await Promise.all([
          locationsResponse.json(),
          entreprisesResponse.json(),
        ]);

        setRetraits(locationsData);
        setFilteredRetraits(locationsData);
        setEntreprises(entreprisesData);
      } catch (error) {
        console.error(
          "Erreur de chargement des détails de la collection :",
          error
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <Page
      fullWidth
      backAction={{ content: "Tableau de bord", url: "/" }}
      title="Points de retrait/TOTEMS"
      titleMetadata={
        <Badge status="success">{retraits.length} Points de retrait</Badge>
      }
      subtitle="Gérez les points de retrait/TOTEM"
      compactTitle
      primaryAction={{
        content: (
          <div style={{ display: "flex" }}>
            <Icon source={ExportMinor} color="base" /> Exporter
          </div>
        ),
        onAction: exportToExcel,
      }}
    >
      <div>
        <Modal open={isLoading} loading small></Modal>
        <style>
          {`
            .Polaris-Modal-CloseButton { 
              display: none;
            }
            .Polaris-Modal-Dialog__Modal.Polaris-Modal-Dialog--sizeSmall {
              max-width: 5rem;
            }
            .Polaris-HorizontalStack {
              --pc-horizontal-stack-gap-xs: var(--p-space-0) !important;
            }
          `}
        </style>
      </div>
      <Layout>
        <Layout.Section>
          <LegacyCard>
            <IndexFilters
              sortOptions={sortOptions}
              sortSelected={sortSelected}
              onSort={handleSortSelected}
              queryValue={queryValue}
              queryPlaceholder="Recherchez dans tout les champs ..."
              onQueryChange={handleFiltersQueryChange}
              onQueryClear={handleFiltersQueryClear}
              primaryAction={primaryAction}
              cancelAction={{
                onAction: onHandleCancel,
                disabled: false,
                loading: false,
              }}
              tabs={tabs}
              selected={selected}
              onSelect={setSelected}
              canCreateNewView
              onCreateNewView={onCreateNewView}
              filters={filters}
              appliedFilters={appliedFilters}
              onClearAll={handleFiltersClearAll}
              mode={mode}
              setMode={setMode}
            />
            <IndexTable
              resourceName={resourceName}
              itemCount={filteredRetraits.length}
              selectedItemsCount={
                allResourcesSelected ? "All" : selectedResources.length
              }
              emptyState={emptyStateMarkup}
              onSelectionChange={handleSelectionChange}
              headings={[
                { title: "Titre" },
                { title: "Adresse" },
                { title: "Ville" },
                { title: "Pays" },
                { title: "Statut" },
              ]}
              onNavigation
            >
              {rowMarkup}
            </IndexTable>
          </LegacyCard>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
