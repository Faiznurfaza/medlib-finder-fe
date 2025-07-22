import { ProTable, PageContainer } from "@ant-design/pro-components"
import type { ActionType, ProColumns } from "@ant-design/pro-components"
import { useRef, useCallback, useState, useEffect, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { Tag, Tooltip, Image } from "antd"
import { MedicineBoxOutlined } from "@ant-design/icons"
import { ChevronDown, ChevronUp } from "lucide-react"

function App() {
  const actionRef = useRef<ActionType>(undefined);
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobile, setIsMobile] = useState(false);
  const [totalMedicines, setTotalMedicines] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const lastRequestRef = useRef<string>('');
  const requestTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current);
      }
    };
  }, []);

  const memoizedParams = useMemo(() => {
    const paramsObj: Record<string, string> = {};
    for (const [key, value] of searchParams.entries()) {
      paramsObj[key] = value;
    }
    return paramsObj;
  }, [searchParams]);

  // Form values that sync with URL parameters
  const formValues = useMemo(() => {
    const values: Record<string, any> = {};
    const searchKeys = ['name', 'composition', 'uses', 'manufacturer', 'sideEffects'];
    
    searchKeys.forEach(key => {
      const value = searchParams.get(key);
      if (value) {
        values[key] = value;
      }
    });
    
    return values;
  }, [searchParams]);

  const fetchMedicine = useCallback(async (params: Record<string, any>): Promise<{
    data: any[];
    success: boolean;
    total: number;
  }> => {
    const mergedParams = { ...memoizedParams, ...params };
    const requestKey = JSON.stringify(mergedParams);
    
    // Prevent duplicate requests with the same parameters
    if (lastRequestRef.current === requestKey) {
      return {
        data: [],
        success: true,
        total: 0,
      };
    }

    // Clear any pending timeout
    if (requestTimeoutRef.current) {
      clearTimeout(requestTimeoutRef.current);
    }

    return new Promise((resolve) => {
      requestTimeoutRef.current = setTimeout(async () => {
        lastRequestRef.current = requestKey;
        setIsLoading(true);
        
        try {
          const query = new URLSearchParams(mergedParams).toString();
          const rawResponse = await fetch(`https://medlib-details-be.vercel.app/api/medicines?${query}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          const result = await rawResponse.json();
          console.log('Fetched medicines:', result);
          if (!rawResponse.ok) {
            throw new Error(result.message || 'Failed to fetch medicines');
          }

          setTotalMedicines(result.pagination?.total || 0);

          resolve({
            data: result.data || [],
            success: true,
            total: result.pagination?.total || 0,
          });
        } catch (error) {
          console.error('Error fetching medicines:', error);
          resolve({
            data: [],
            success: false,
            total: 0,
          });
        } finally {
          setIsLoading(false);
          lastRequestRef.current = '';
        }
      }, 100); // 100ms debounce
    });
  }, [memoizedParams]);

  const handleTableChange = useCallback((params: Record<string, any>, _sort: any, _filter: any) => {
    const allowedKeys = ['current', 'pageSize', 'name', 'composition', 'uses', 'manufacturer', 'sideEffects'];
    const filteredParams: Record<string, any> = {};

    Object.entries({ ...memoizedParams, ...params }).forEach(([key, value]) => {
      if (allowedKeys.includes(key) && value !== undefined && value !== '') {
        filteredParams[key] = value;
      }
    });

    setSearchParams(filteredParams);
  }, [memoizedParams, setSearchParams]);

  const handleTableSubmit = useCallback((params: Record<string, any>) => {
    const allowedKeys = ['current', 'pageSize', 'name', 'composition', 'uses', 'manufacturer', 'sideEffects'];
    const filteredParams: Record<string, any> = {};

    Object.entries({ ...memoizedParams, ...params }).forEach(([key, value]) => {
      if (allowedKeys.includes(key) && value !== undefined && value !== '') {
        filteredParams[key] = value;
      }
    });

    filteredParams.current = 1;
    setSearchParams(filteredParams);
  }, [memoizedParams, setSearchParams]);

  const handleTableReset = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  const columns: ProColumns[] = [
    {
      title: 'Medicine Name',
      dataIndex: 'name',
      key: 'name',
      width: isMobile ? 120 : 200,
      minWidth: isMobile ? 120 : 180,
      fixed: isMobile ? 'left' : undefined,
      render: (_dom, entity) => (
        <div className="flex items-center gap-1 md:gap-2 min-w-[100px] w-full">
          <Image
            src={entity.imageUrl}
            width={isMobile ? 24 : 28}
            height={isMobile ? 24 : 28}
            style={{ objectFit: 'cover', borderRadius: 6, border: '1px solid #eee' }}
            preview={{ mask: <span>Click to enlarge</span> }}
            alt={entity.name}
            className="md:w-9 md:h-9 w-6 h-6"
          />
          <div className="flex flex-col gap-0">
            <Tooltip title={entity.name}>
              <div
                className="font-bold text-gray-800 text-xs md:text-base"
                style={{
                  maxWidth: isMobile ? 70 : 'none',
                  width: isMobile ? 70 : 'fit-content',
                  overflow: isMobile ? 'hidden' : 'visible',
                  textOverflow: isMobile ? 'ellipsis' : 'unset',
                  whiteSpace: isMobile ? 'nowrap' : 'normal',
                }}
              >
                {entity.name}
              </div>
            </Tooltip>
            {!isMobile && (
              <div className="text-xs text-gray-500">{entity.manufacturer}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Composition',
      dataIndex: 'composition',
      key: 'composition',
      ellipsis: true,
      width: isMobile ? 120 : 180,
      render: (_dom, entity) => {
        const compositionArray = entity.composition.split(/\s*\+\s*/);
        const visibleCount = isMobile ? 2 : 5;
        const hiddenComposition = compositionArray.slice(visibleCount);

        return (
          <Tooltip title={entity.composition}>
            <ul className="list-disc pl-3">
              {compositionArray
                .slice(0, visibleCount)
                .map((item: string, idx: number) => (
                  <li key={idx} className="whitespace-normal text-xs md:text-sm">{item.trim()}</li>
                ))}
              {compositionArray.length > visibleCount && (
                <Tooltip
                  title={
                    <div>
                      <ul className="list-disc pl-4">
                        {hiddenComposition.map((item: string, idx: number) => (
                          <li key={idx} className="mb-1">{item.trim()}</li>
                        ))}
                      </ul>
                    </div>
                  }
                  overlayStyle={{ maxWidth: '300px' }}
                >
                  <li className="text-xs text-blue-500 cursor-help">
                    +{hiddenComposition.length} more components
                  </li>
                </Tooltip>
              )}
            </ul>
          </Tooltip>
        );
      },
    },
    {
      title: 'Uses / Indications',
      dataIndex: 'uses',
      key: 'uses',
      ellipsis: true,
      width: isMobile ? 100 : 200,
      minWidth: isMobile ? 100 : 180,
      render: (_dom, entity) => {
        const usesArray = entity.uses
          .replace(/([a-z])([A-Z])/g, '$1|$2')
          .split('|');
        const visibleCount = isMobile ? 2 : 4;
        const hiddenUses = usesArray.slice(visibleCount);

        return (
          <ul className="list-disc pl-3">
            {usesArray
              .slice(0, visibleCount)
              .map((item: string, idx: number) => (
                <Tooltip title={item.trim()} key={idx}>
                  <li
                    className="text-xs md:text-sm"
                    style={{
                      maxWidth: isMobile ? 80 : 'none',
                      width: isMobile ? 80 : 'fit-content',
                      overflow: isMobile ? 'hidden' : 'visible',
                      textOverflow: isMobile ? 'ellipsis' : 'unset',
                      whiteSpace: isMobile ? 'nowrap' : 'normal',
                    }}
                  >
                    {item.trim()}
                  </li>
                </Tooltip>
              ))}
            {usesArray.length > visibleCount && (
              <Tooltip
                title={
                  <div>
                    <ul className="list-disc pl-4">
                      {hiddenUses.map((item: string, idx: number) => (
                        <li key={idx} className="mb-1">{item.trim()}</li>
                      ))}
                    </ul>
                  </div>
                }
                overlayStyle={{ maxWidth: '300px' }}
              >
                <li className="text-xs text-blue-500 cursor-help">
                  +{hiddenUses.length} more uses
                </li>
              </Tooltip>
            )}
          </ul>
        );
      },
    },
    {
      title: 'Side Effects',
      dataIndex: 'sideEffects',
      key: 'sideEffects',
      width: isMobile ? 100 : 140,
      render: (_dom, entity) => {
        const sideEffectsArray = entity.sideEffects.replace(/ ([A-Z])/g, ', $1').split(',');
        const visibleCount = isMobile ? 2 : 4;
        const hiddenEffects = sideEffectsArray.slice(visibleCount);

        return (
          <div className="flex flex-wrap gap-1">
            {sideEffectsArray
              .slice(0, visibleCount)
              .map((item: string, idx: number) => (
                <Tooltip title={item.trim()} key={idx}>
                  <Tag
                    color="volcano"
                    className="text-xs md:text-sm"
                    style={{
                      maxWidth: isMobile ? 60 : 80,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'inline-block',
                    }}
                  >
                    {item.trim()}
                  </Tag>
                </Tooltip>
              ))}
            {sideEffectsArray.length > visibleCount && (
              <Tooltip
                title={
                  <div>
                    <ul className="list-disc pl-4">
                      {hiddenEffects.map((item: string, idx: number) => (
                        <li key={idx} className="mb-1">{item.trim()}</li>
                      ))}
                    </ul>
                  </div>
                }
                overlayStyle={{ maxWidth: '300px' }}
              >
                <Tag color="orange" className="text-xs cursor-help">
                  +{hiddenEffects.length} more
                </Tag>
              </Tooltip>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <PageContainer
      header={{
        title: (
          <div className="flex items-center gap-1 md:gap-2">
            <MedicineBoxOutlined style={{ fontSize: isMobile ? 20 : 24, color: "#1890ff" }} />
            <span className="font-bold text-sm md:text-xl truncate">MedInfo Finder</span>
          </div>
        ),
        subTitle: !isMobile ? (
          <div className="flex flex-col gap-1">
            <span className="text-gray-500 text-xs md:text-base">
              Search and compare medicines efficiently
            </span>
            {totalMedicines > 0 && (
              <span className="text-blue-600 text-xs font-medium">
                {isLoading ? 'Loading...' : `${totalMedicines.toLocaleString()} medicines available`}
              </span>
            )}
          </div>
        ) : undefined,
        extra: !isMobile ? (
          <div className="text-xs text-gray-400 hidden md:block">
            💊 Comprehensive Medicine Database
          </div>
        ) : undefined,
      }}
      className="bg-gray-50 min-h-screen p-1 md:p-4"
    >
      <div className="bg-white rounded-xl shadow-md p-1 md:p-4">
        <div className="overflow-x-auto w-full">
          <ProTable
            key={JSON.stringify(formValues)}
            actionRef={actionRef}
            columns={columns}
            request={fetchMedicine}
            rowKey="id"
            form={{
              initialValues: formValues,
              syncToUrl: false,
            }}
            scroll={{
              x: isMobile ? 400 : 'max-content',
              y: isMobile ? 400 : 'calc(100vh - 320px)'
            }}
            sticky={{
              offsetHeader: isMobile ? 0 : 64,
              offsetScroll: isMobile ? 0 : 24,
              getContainer: () => window,
            }}
            bordered
            size={isMobile ? 'small' : 'middle'}
            locale={{
              emptyText: (
                <div className="py-8 text-center">
                  <MedicineBoxOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                  <div className="text-gray-500 mb-2">No medicines found</div>
                  <div className="text-gray-400 text-sm">Try adjusting your search criteria</div>
                </div>
              ),
            }}
            pagination={{
              current: Number(searchParams.get('current')) || 1,
              pageSize: Number(searchParams.get('pageSize')) || 10,
              defaultPageSize: 10,
              showSizeChanger: !isMobile,
              showQuickJumper: !isMobile,
              simple: isMobile,
            }}
            options={{
              reload: true,
              setting: true,
              density: true,
            }}
            search={{
              labelWidth: 'auto',
              resetText: isMobile ? '🔄' : '🔄 Reset',
              searchText: isMobile ? '🔍' : '🔍 Search',
              defaultCollapsed: isMobile,
              collapseRender: (collapsed) => (
                <div className="flex items-center gap-1">
                  {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                  <span>{collapsed ? 'Expand' : 'Collapse'}</span>
                </div>
              ),
            }}
            toolBarRender={false}
            onChange={handleTableChange}
            onSubmit={handleTableSubmit}
            onReset={handleTableReset}
            className="rounded-lg"
          />
        </div>
      </div>
    </PageContainer>
  )
}

export default App;