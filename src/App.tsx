import { ProTable, PageContainer } from "@ant-design/pro-components"
import type { ActionType, ProColumns } from "@ant-design/pro-components"
import { useRef, useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { Tag, Tooltip, Image } from "antd"
import { MedicineBoxOutlined } from "@ant-design/icons"

function App() {
  const actionRef = useRef<ActionType>(undefined);
  const [searchParams, setSearchParams] = useSearchParams();

  const getParamsObject = () => {
    const paramsObj: Record<string, string> = {};
    for (const [key, value] of searchParams.entries()) {
      paramsObj[key] = value;
    }
    return paramsObj;
  };

  const fetchMedicine = async (params: Record<string, any>) => {
    const mergedParams = { ...getParamsObject(), ...params };
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
    return {
      data: result.data || [],
      success: true,
      total: result.pagination?.total || 0,
    };
  };

  const handleTableChange = useCallback((params: Record<string, any>, _sort: any, _filter: any) => {
    const allowedKeys = ['current', 'pageSize', 'name', 'composition', 'uses', 'manufacturer', 'sideEffects'];
    const filteredParams: Record<string, any> = {};

    Object.entries({ ...getParamsObject(), ...params }).forEach(([key, value]) => {
      if (allowedKeys.includes(key) && value !== undefined && value !== '') {
        filteredParams[key] = value;
      }
    });

    setSearchParams(filteredParams);
  }, [searchParams, setSearchParams]);

  const handleTableSubmit = useCallback((params: Record<string, any>) => {
    const allowedKeys = ['current', 'pageSize', 'name', 'composition', 'uses', 'manufacturer', 'sideEffects'];
    const filteredParams: Record<string, any> = {};

    Object.entries({ ...getParamsObject(), ...params }).forEach(([key, value]) => {
      if (allowedKeys.includes(key) && value !== undefined && value !== '') {
        filteredParams[key] = value;
      }
    });

    filteredParams.current = 1;
    setSearchParams(filteredParams);
  }, [searchParams, setSearchParams]);

  const handleTableReset = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  const columns: ProColumns[] = [
    {
      title: 'Medicine',
      dataIndex: 'name',
      key: 'name',
      minWidth: 140,
      render: (_dom, entity) => (
        <div className="flex items-center gap-2 min-w-[140px] w-full">
          <Image
            src={entity.imageUrl}
            width={28}
            height={28}
            style={{ objectFit: 'cover', borderRadius: 8, border: '1px solid #eee' }}
            preview={{ mask: <span>Click to enlarge</span> }}
            alt={entity.name}
            className="md:w-9 md:h-9 w-7 h-7"
          />
          <Tooltip title={entity.name}>
            <div
              style={{
                maxWidth: 100,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              className="font-bold text-gray-800 text-xs md:text-base"
            >
              {entity.name}
            </div>
          </Tooltip>
          <div className="text-xs text-gray-500 hidden md:block">{entity.manufacturer}</div>
        </div>
      ),
    },
    {
      title: 'Composition',
      dataIndex: 'composition',
      key: 'composition',
      ellipsis: true,
      minWidth: 140,
      render: (_dom, entity) => (
        <Tooltip title={entity.composition}>
          <ul className="list-disc pl-4">
            {entity.composition
              .split(/\s*\+\s*/)
              .map((item: string, idx: number) => (
                <li key={idx} className="whitespace-normal text-xs md:text-sm">{item.trim()}</li>
              ))}
          </ul>
        </Tooltip>
      ),
    },
    {
      title: 'Uses',
      dataIndex: 'uses',
      key: 'uses',
      ellipsis: true,
      minWidth: 140,
      render: (_dom, entity) => (
        <ul className="list-disc pl-4">
          {entity.uses
            .replace(/([a-z])([A-Z])/g, '$1|$2')
            .split('|')
            .map((item: string, idx: number) => (
              <Tooltip title={item.trim()} key={idx}>
                <li
                  className="text-xs md:text-sm"
                  style={{
                    maxWidth: 100,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.trim()}
                </li>
              </Tooltip>
            ))}
        </ul>
      ),
    },
    {
      title: 'Side Effects',
      dataIndex: 'sideEffects',
      key: 'sideEffects',
      minWidth: 100,
      render: (_dom, entity) => (
        <div className="flex flex-wrap gap-1">
          {entity.sideEffects.replace(/ ([A-Z])/g, ', $1').split(',').map((item: string, idx: number) => (
            <Tooltip title={item.trim()} key={idx}>
              <Tag
                color="volcano"
                className="text-xs md:text-sm"
                style={{
                  maxWidth: 80,
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
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      header={{
        title: (
          <div className="flex items-center gap-2">
            <MedicineBoxOutlined style={{ fontSize: 24, color: "#1890ff" }} />
            <span className="font-bold text-base md:text-xl">MedInfo Finder</span>
          </div>
        ),
        subTitle: (
          <span className="text-gray-500 text-xs md:text-base">Search and compare medicines efficiently</span>
        ),
      }}
      className="bg-gray-50 min-h-screen p-1 md:p-4"
    >
      <div className="bg-white rounded-xl shadow-md p-1 md:p-4">
        <div className="overflow-x-auto w-full">
          <ProTable
            actionRef={actionRef}
            columns={columns}
            request={fetchMedicine}
            rowKey="id"
            scroll={{ x: 'max-content' }}
            sticky
            bordered
            pagination={{
              current: Number(searchParams.get('current')) || 1,
              pageSize: Number(searchParams.get('pageSize')) || 10,
              defaultPageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
            }}
            options={{
              reload: true,
              setting: true,
              density: true,
            }}
            search={{
              labelWidth: 'auto',
              resetText: 'Reset',
              searchText: 'Search',
            }}
            toolBarRender={false}
            params={getParamsObject()}
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